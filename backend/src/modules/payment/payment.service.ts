import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as crypto from 'crypto';
import * as https from 'https';
import * as http from 'http';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger('PaymentService');

  // ShareFlow 配置
  private readonly API_BASE = process.env.SHAREFLOW_API_BASE || 'http://118.25.48.22:8080/api/v1';
  private readonly API_ROOT = process.env.SHAREFLOW_API_ROOT || 'http://118.25.48.22:8080';
  private readonly APP_ID = process.env.SHAREFLOW_APP_ID || 'peiwan_app_001';
  private readonly API_KEY = process.env.SHAREFLOW_API_KEY || '';
  private readonly COIN_RATE = Number(process.env.COIN_EXCHANGE_RATE || 10); // 1元=多少星石

  constructor(private prisma: PrismaService) {}

  // ========== 签名算法 ==========

  /**
   * 生成MD5签名
   * 1. 移除sign和空值参数
   * 2. 按ASCII排序
   * 3. 拼接 key=value&...
   * 4. 末尾拼接 &key=API_KEY
   * 5. MD5加密（32位小写）
   */
  generateSign(params: Record<string, any>): string {
    const filtered: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (k === 'sign') continue;
      if (v === null || v === undefined || v === '') continue;
      filtered[k] = String(v);
    }
    const sortedKeys = Object.keys(filtered).sort();
    const signStr = sortedKeys.map(k => `${k}=${filtered[k]}`).join('&') + `&key=${this.API_KEY}`;
    return crypto.createHash('md5').update(signStr).digest('hex');
  }

  /**
   * 验证签名
   */
  verifySign(params: Record<string, any>): boolean {
    const sign = params.sign;
    if (!sign) return false;
    const expected = this.generateSign({ ...params });
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
    if (amountYuan <= 0) throw new Error('金额必须大于0');

    const coinAmount = Math.floor(amountYuan * this.COIN_RATE);
    const outOrderNo = `RECHARGE${Date.now()}${Math.floor(Math.random() * 10000)}`;

    // 1. 先在本地创建待支付订单
    const order = await this.prisma.paymentOrder.create({
      data: {
        userId,
        outOrderNo,
        amount: amountYuan.toFixed(2),
        coinAmount,
        productName: `星石充值${amountYuan}元`,
        payStatus: 'pending_pay',
      },
    });

    // 2. 调用 ShareFlow 创建支付订单
    const params: Record<string, any> = {
      app_id: this.APP_ID,
      out_order_no: outOrderNo,
      total_amount: amountYuan.toFixed(2),
      product_name: `星石充值${amountYuan}元`,
      product_desc: `兑换${coinAmount}星石`,
      category: 'recharge',
      timestamp: Math.floor(Date.now() / 1000).toString(),
    };
    if (payerName) params.payer_name = payerName;
    params.sign = this.generateSign(params);

    try {
      const res: any = await this.post(`${this.API_BASE}/payment/create`, params);
      if (res.code !== 0) {
        await this.prisma.paymentOrder.update({
          where: { id: order.id },
          data: { payStatus: 'expired' },
        });
        throw new Error(res.msg || '创建支付订单失败');
      }

      const data = res.data;
      const payFullUrl = this.API_ROOT + data.pay_url;

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
        const res: any = await this.get(`${this.API_BASE}/payment/status/${order.shareflowNo}`);
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
    // 1. 验证签名
    if (!this.verifySign({ ...body })) {
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
}
