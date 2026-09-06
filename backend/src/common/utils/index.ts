import * as dayjs from 'dayjs';

// 生成订单号：MTX + 年月日时分秒 + 4位随机数
export function generateOrderNo(): string {
  const time = dayjs().format('YYYYMMDDHHmmss');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `MTX${time}${random}`;
}

// 星石转元（1元 = 10星石）
export function coinToYuan(coin: number): number {
  const rate = parseInt(process.env.COIN_EXCHANGE_RATE) || 10;
  return coin / rate;
}

// 元转星石
export function yuanToCoin(yuan: number): number {
  const rate = parseInt(process.env.COIN_EXCHANGE_RATE) || 10;
  return Math.round(yuan * rate);
}

// 分页参数处理
export function getPagination(page: number = 1, pageSize: number = 20) {
  const p = Math.max(1, parseInt(String(page)) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(String(pageSize)) || 20));
  return {
    skip: (p - 1) * ps,
    take: ps,
    page: p,
    pageSize: ps,
  };
}

// 脱敏手机号
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}
