import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SystemConfigService } from '../system-config/system-config.service';
import * as crypto from 'crypto';
import * as https from 'https';
import * as http from 'http';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger('PaymentService');

  constructor(
    private prisma: PrismaService,
    private configService: SystemConfigService,
  ) {}

  // 从数据库读取配置
  private async getConfig() {
    const [enabled, apiBase, apiRoot, appId, apiKey, coinRate] = await Promise.all([
      this.configService.get('payment_enabled'),
      this.configService.get('payment_shareflow_api_base'),
      this.configService.get('payment_shareflow_api_root'),
      this.configService.get('payment_shareflow_app_id'),
      this.configService.get('payment_shareflow_api_key'),
      this.configService.getNumber('coin_exchange_rate'),
    ]);
    return {
      enabled: enabled === 'true',
      API_BASE: apiBase || 'http://118.25.48.22:8080/api/v1',
      API_ROOT: apiRoot || 'http://118.25.48.22:8080',
      APP_ID: appId || 'peiwan_app_001',
      API_KEY: apiKey || '',
      COIN_RATE: coinRate || 10,
    };
  }

  // ========== 签名算法 ==========

  /**
   * 生成MD5签名
   */
  generateSign(params: Record<string, any>, apiKey: string): string {
    const filtered: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (k === 'sign') continue;
      if (v === null || v === undefined || v === '') continue;
      filtered[k] = String(v);
    }
    const sortedKeys = Object.keys(filtered).sort();
    const signStr = sortedKeys.map(k => `${k}=${filtered[k]}`).join('&') + `&key=${apiKey}`;
    return crypto.createHash('md5').update(signStr).digest('hex');
  }

  /**
   * 验证签名
   */
  verifySign(params: Record<string, any>, apiKey: string): boolean {
    const sign = params.sign;
    if (!sign) return false;
    const expected = this.generateSign({ ...params }, apiKey);
    return sign === expected;
  }

  // ========== HTTP 请求 ==========

  private async post(url: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      const postData = JSON.stringify(data);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 10000,
      };
      const req = client.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch (e) { reject(new Error('响应解析失败: ' + body)); }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('请求超时')); });
      req.write(postData);
      req.end();
    });
  }

  private async get(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        timeout: 10000,
      };
      const req = client.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch (e) { reject(new Error('响应解析失败: ' + body)); }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('请求超时')); });
      req.end();
    });
  }

  // ========== 业务方法 ==========

  /**
   * 创建充值订单
   */
  async createRecharge(userId: number, amountYuan: number, payerName?: string) {
    if (!userId) throw new Error('用户ID无效');
    if (amountYuan <= 0) throw new Error('金额必须大于0');

    const cfg = await this.getConfig();
    if (!cfg.enabled) throw new Error('支付功能未启用');
    if (!cfg.API_KEY) throw new Error('支付密钥未配置');

    const coinAmount = Math.floor(amountYuan * cfg.COIN_RATE);
    const outOrderNo = `RECHARGE${Date.now()}${Math.floor(Math.random() * 10000)}`;

    this.logger.log(`创建充值订单: userId=${userId}, amount=${amountYuan}, outOrderNo=${outOrderNo}`);

    // 1. 先在本地创建待支付订单
    const order = await this.prisma.paymentOrder.create({
      data: {
        user: { connect: { id: userId } },
        outOrderNo,
        amount: amountYuan.toFixed(2),
        coinAmount,
        productName: `星石充值${amountYuan}元`,
        payStatus: 'pending_pay',
      },
    });

    this.logger.log(`本地订单创建成功: orderId=${order.id}`);

    // 2. 调用 ShareFlow 创建支付订单
    const params: Record<string, any> = {
      app_id: cfg.APP_ID,
      out_order_no: outOrderNo,
      total_amount: amountYuan.toFixed(2),
      product_name: `星石充值${amountYuan}元`,
      product_desc: `兑换${coinAmount}星石`,
      category: 'recharge',
      timestamp: Math.floor(Date.now() / 1000).toString(),
    };
    if (payerName) params.payer_name = payerName;
    params.sign = this.generateSign(params, cfg.API_KEY);

    try {
      const res: any = await this.post(`${cfg.API_BASE}/payment/create`, params);
      if (res.code !== 0) {
        await this.prisma.paymentOrder.update({
          where: { id: order.id },
          data: { payStatus: 'expired' },
        });
        throw new Error(res.msg || '创建支付订单失败');
      }

      const data = res.data;
      const payFullUrl = cfg.API_ROOT + data.pay_url;

      // 3. 更新本地订单
      await this.prisma.paymentOrder.update({
        where: { id: order.id },
        data: {
          shareflowNo: data.order_no,
          payUrl: payFullUrl,
          wechatQr: data.qr_code_urls?.wechat || null,
          alipayQr: data.qr_code_urls?.alipay || null,
          expireAt: data.expire_at ? new Date(data.expire_at) : null,
        },
      });

      return {
        orderId: order.id,
        outOrderNo,
        shareflowNo: data.order_no,
        amount: amountYuan,
        coinAmount,
        payUrl: payFullUrl,
        wechatQr: data.qr_code_urls?.wechat,
        alipayQr: data.qr_code_urls?.alipay,
        expireAt: data.expire_at,
      };
    } catch (e: any) {
      this.logger.error('创建支付订单失败: ' + e.message);
      throw e;
    }
  }

  /**
   * 查询支付状态（前端轮询用）
   */
  async queryStatus(orderId: number) {
    if (!orderId || isNaN(orderId)) {
      return { payStatus: 'pending_pay', paidAt: null };
    }
    const order = await this.prisma.paymentOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('订单不存在');

    // 如果已经是终态，直接返回
    if (order.payStatus === 'paid' || order.payStatus === 'expired') {
      return {
        payStatus: order.payStatus,
        paidAt: order.paidAt,
      };
    }

    // 向 ShareFlow 查询最新状态
    if (order.shareflowNo) {
      try {
        const cfg = await this.getConfig();
        const res: any = await this.get(`${cfg.API_BASE}/payment/status/${order.shareflowNo}`);
        if (res.code === 0 && res.data) {
          const status = res.data.pay_status;
          // 如果状态变化，更新本地
          if (status !== order.payStatus) {
            await this.prisma.paymentOrder.update({
              where: { id: order.id },
              data: {
                payStatus: status,
                paidAt: res.data.paid_at ? new Date(res.data.paid_at) : null,
              },
            });
            // 如果是已支付，处理到账
            if (status === 'paid') {
              await this.processPaymentSuccess(order.id);
            }
          }
          return { payStatus: status, paidAt: res.data.paid_at };
        }
      } catch (e: any) {
        this.logger.error('查询支付状态失败: ' + e.message);
      }
    }

    return { payStatus: order.payStatus, paidAt: order.paidAt };
  }

  /**
   * 接收 ShareFlow 回调
   */
  async handleNotify(body: any) {
    const cfg = await this.getConfig();

    // 1. 验证签名
    if (!this.verifySign({ ...body }, cfg.API_KEY)) {
      this.logger.warn('回调签名验证失败: ' + JSON.stringify(body));
      return { code: -1, msg: '签名验证失败' };
    }

    // 2. 验证支付状态
    if (body.pay_status !== 'paid') {
      return { code: -1, msg: '支付状态异常' };
    }

    const outOrderNo = body.out_order_no;
    const totalAmount = body.total_amount;

    // 3. 查找订单
    const order = await this.prisma.paymentOrder.findUnique({ where: { outOrderNo } });
    if (!order) {
      this.logger.warn('回调订单不存在: ' + outOrderNo);
      return { code: -1, msg: '订单不存在' };
    }

    // 4. 幂等处理：已处理过直接返回成功
    if (order.payStatus === 'paid') {
      this.logger.log(`订单 ${outOrderNo} 已处理，跳过`);
      return { code: 0, msg: 'success' };
    }

    // 5. 验证金额
    if (Number(order.amount) !== Number(totalAmount)) {
      this.logger.warn(`回调金额不匹配: 订单${order.amount}, 回调${totalAmount}`);
      return { code: -1, msg: '金额不匹配' };
    }

    // 6. 更新订单状态并到账
    await this.prisma.paymentOrder.update({
      where: { id: order.id },
      data: {
        payStatus: 'paid',
        paidAt: body.paid_at ? new Date(body.paid_at) : new Date(),
        transactionId: body.transaction_id || null,
        shareflowNo: body.order_no || order.shareflowNo,
      },
    });

    await this.processPaymentSuccess(order.id);

    this.logger.log(`订单 ${outOrderNo} 支付成功，金额 ${totalAmount}，到账 ${order.coinAmount} 星石`);
    return { code: 0, msg: 'success' };
  }

  /**
   * 处理支付成功：增加用户余额，记录流水
   */
  private async processPaymentSuccess(orderId: number) {
    const order = await this.prisma.paymentOrder.findUnique({ where: { id: orderId } });
    if (!order || order.payStatus !== 'paid') return;

    // 检查是否已经到账（幂等）
    const existingTx = await this.prisma.walletTransaction.findFirst({
      where: {
        userId: order.userId,
        type: 'RECHARGE',
        orderId: order.id,
      },
    });
    if (existingTx) {
      this.logger.log(`订单 ${order.outOrderNo} 已到账，跳过`);
      return;
    }

    // 增加余额
    const wallet = await this.prisma.wallet.update({
      where: { userId: order.userId },
      data: { balance: { increment: order.coinAmount } },
    });

    // 记录流水
    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId: order.userId,
        type: 'RECHARGE',
        amount: order.coinAmount,
        balanceAfter: wallet.balance,
        orderId: order.id,
        remark: `星石充值${order.amount}元`,
      },
    });

    this.logger.log(`用户 ${order.userId} 充值到账 ${order.coinAmount} 星石`);
  }

  /**
   * 获取用户充值记录
   */
  async getUserRecharges(userId: number, page: number, pageSize: number) {
    const [list, total] = await Promise.all([
      this.prisma.paymentOrder.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.paymentOrder.count({ where: { userId } }),
    ]);
    return { list, total, page, pageSize };
  }

  /**
   * 管理端：充值统计
   */
  async getAdminStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 用 findMany 代替 aggregate，避免 BigInt 序列化问题
    const [todayPaid, allPaid] = await Promise.all([
      this.prisma.paymentOrder.findMany({
        where: { payStatus: 'paid', createdAt: { gte: todayStart } },
        select: { amount: true },
      }),
      this.prisma.paymentOrder.findMany({
        where: { payStatus: 'paid' },
        select: { amount: true },
      }),
    ]);

    const todayAmount = todayPaid.reduce((sum, o) => sum + Number(o.amount), 0);
    const totalAmount = allPaid.reduce((sum, o) => sum + Number(o.amount), 0);

    return {
      todayCount: todayPaid.length,
      todayAmount: todayAmount.toFixed(2),
      totalCount: allPaid.length,
      totalAmount: totalAmount.toFixed(2),
    };
  }

  /**
   * 管理端：所有充值订单列表
   */
  async getAllOrders(page: number, pageSize: number, status?: string) {
    const where: any = {};
    if (status) where.payStatus = status;

    const [list, total] = await Promise.all([
      this.prisma.paymentOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, username: true, nickname: true } } },
      }),
      this.prisma.paymentOrder.count({ where }),
    ]);
    return { list, total, page, pageSize };
  }
}
