import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// 默认配置
const DEFAULT_CONFIGS: Record<string, { value: string; description: string }> = {
  platform_fee_rate: { value: '20', description: '平台抽成比例（%）' },
  coin_exchange_rate: { value: '10', description: '星石兑换人民币比例（1元=多少星石）' },
  client_theme: {
    value: JSON.stringify({ primaryColor: '#1a1a2e', accentColor: '#e94560', bgColor: '#0f0f1a' }),
    description: '老板端主题配置（JSON）',
  },
  min_withdraw: { value: '100', description: '最低提现金额（星石）' },
  withdraw_fee_rate: { value: '5', description: '提现手续费比例（%）' },
  order_expire_hours: { value: '2', description: '订单过期时间（小时）' },
};

@Injectable()
export class SystemConfigService {
  constructor(private prisma: PrismaService) {}

  // 获取所有配置
  async getAll() {
    const configs = await this.prisma.systemConfig.findMany();
    const result: Record<string, string> = {};
    for (const c of configs) {
      result[c.key] = c.value;
    }
    // 合并默认值
    for (const [key, def] of Object.entries(DEFAULT_CONFIGS)) {
      if (!(key in result)) {
        result[key] = def.value;
      }
    }
    return result;
  }

  // 获取单个配置
  async get(key: string): Promise<string> {
    const config = await this.prisma.systemConfig.findUnique({ where: { key } });
    if (config) return config.value;
    return DEFAULT_CONFIGS[key]?.value ?? '';
  }

  // 获取数值型配置
  async getNumber(key: string): Promise<number> {
    const val = await this.get(key);
    return parseFloat(val) || 0;
  }

  // 获取JSON配置
  async getJSON(key: string): Promise<any> {
    const val = await this.get(key);
    try {
      return JSON.parse(val);
    } catch {
      return {};
    }
  }

  // 更新配置（批量）
  async updateMany(items: Array<{ key: string; value: string }>) {
    for (const item of items) {
      await this.prisma.systemConfig.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: {
          key: item.key,
          value: item.value,
          description: DEFAULT_CONFIGS[item.key]?.description || '',
        },
      });
    }
    return { success: true };
  }

  // 初始化默认配置
  async initDefaults() {
    for (const [key, def] of Object.entries(DEFAULT_CONFIGS)) {
      await this.prisma.systemConfig.upsert({
        where: { key },
        update: {},
        create: { key, value: def.value, description: def.description },
      });
    }
    return { success: true };
  }
}
