import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始初始化种子数据...');

  // ==================== 1. 创建管理员账号 ====================
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      nickname: '超级管理员',
      role: Role.ADMIN,
      isVerified: true,
      wallet: { create: {} },
    },
  });
  console.log('✅ 管理员账号: admin / admin123');

  // ==================== 2. 创建客服账号 ====================
  const operatorPassword = await bcrypt.hash('operator123', 10);
  await prisma.user.upsert({
    where: { username: 'kefu001' },
    update: {},
    create: {
      username: 'kefu001',
      password: operatorPassword,
      nickname: '客服小星星',
      role: Role.OPERATOR,
      isVerified: true,
      wallet: { create: {} },
    },
  });
  console.log('✅ 客服账号: kefu001 / operator123');

  // ==================== 2.1 创建平台钱包账户 ====================
  const platformPassword = await bcrypt.hash('platform_wallet_2026', 10);
  await prisma.user.upsert({
    where: { username: 'platform' },
    update: {},
    create: {
      username: 'platform',
      password: platformPassword,
      nickname: '平台钱包',
      role: Role.ADMIN,
      isVerified: true,
      wallet: { create: {} },
    },
  });
  console.log('✅ 平台钱包账户已创建');

  // ==================== 3. 创建游戏类目 ====================
  const games = [
    { name: '王者荣耀', icon: '', sortOrder: 1 },
    { name: '和平精英', icon: '', sortOrder: 2 },
    { name: '英雄联盟', icon: '', sortOrder: 3 },
    { name: '三角洲行动', icon: '', sortOrder: 4 },
    { name: '原神', icon: '', sortOrder: 5 },
    { name: '永劫无间', icon: '', sortOrder: 6 },
  ];

  for (const g of games) {
    await prisma.game.upsert({
      where: { name: g.name },
      update: {},
      create: g,
    });
  }
  console.log(`✅ 创建 ${games.length} 个游戏类目`);

  // ==================== 4. 创建服务项目 ====================
  const gameRecords = await prisma.game.findMany();
  const serviceItems = [
    { gameName: '王者荣耀', name: '陪玩上分', defaultPrice: 30, unit: 'hour' },
    { gameName: '王者荣耀', name: '技术教学', defaultPrice: 50, unit: 'hour' },
    { gameName: '王者荣耀', name: '娱乐陪聊', defaultPrice: 20, unit: 'hour' },
    { gameName: '和平精英', name: '陪玩吃鸡', defaultPrice: 35, unit: 'hour' },
    { gameName: '和平精英', name: '技术教学', defaultPrice: 50, unit: 'hour' },
    { gameName: '英雄联盟', name: '陪玩上分', defaultPrice: 40, unit: 'hour' },
    { gameName: '英雄联盟', name: '技术教学', defaultPrice: 60, unit: 'hour' },
    { gameName: '三角洲行动', name: '陪玩护航', defaultPrice: 50, unit: 'hour' },
    { gameName: '三角洲行动', name: '技术教学', defaultPrice: 80, unit: 'hour' },
    { gameName: '原神', name: '代肝日常', defaultPrice: 30, unit: 'hour' },
    { gameName: '永劫无间', name: '陪玩上分', defaultPrice: 40, unit: 'hour' },
  ];

  for (const item of serviceItems) {
    const game = gameRecords.find((g) => g.name === item.gameName);
    if (game) {
      await prisma.serviceItem.upsert({
        where: { id: 0 }, // 用唯一约束判断
        update: {},
        create: {
          gameId: game.id,
          name: item.name,
          defaultPrice: item.defaultPrice,
          unit: item.unit,
        },
      }).catch(() => {}); // 忽略重复
    }
  }
  console.log(`✅ 创建 ${serviceItems.length} 个服务项目`);

  // ==================== 5. 创建测试老板账号 ====================
  const customerPassword = await bcrypt.hash('test1234', 10);
  for (let i = 1; i <= 3; i++) {
    await prisma.user.upsert({
      where: { username: `boss00${i}` },
      update: {},
      create: {
        username: `boss00${i}`,
        password: customerPassword,
        nickname: `测试老板${i}号`,
        role: Role.CUSTOMER,
        phone: `1380000000${i}`,
        isVerified: true,
        wallet: {
          create: { balance: 10000 }, // 送10000星石（1000元）
        },
      },
    });
  }
  console.log('✅ 创建3个测试老板账号: boss001~003 / test1234 (每人10000星石)');

  // ==================== 6. 创建测试陪玩账号 ====================
  for (let i = 1; i <= 5; i++) {
    const provider = await prisma.user.upsert({
      where: { username: `pw00${i}` },
      update: {},
      create: {
        username: `pw00${i}`,
        password: customerPassword,
        nickname: `陪玩小${['一', '二', '三', '四', '五'][i - 1]}`,
        role: Role.PROVIDER,
        phone: `1390000000${i}`,
        isVerified: true,
        gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
        bio: '专业陪玩，技术过硬，声音好听，服务周到！',
        wallet: { create: {} },
        providerProfile: {
          create: {
            level: Math.min(5, i + 2),
            rating: 4.5 + i * 0.1,
            ratingCount: 10 + i * 5,
            orderCount: 20 + i * 10,
            isOnline: i <= 3,
            acceptOrder: true,
            applyStatus: 'APPROVED',
          },
        },
      },
      include: { providerProfile: true },
    });

    // 给陪玩添加服务
    if (provider.providerProfile) {
      const serviceRecords = await prisma.serviceItem.findMany({ take: 3 });
      for (const svc of serviceRecords) {
        await prisma.providerService.upsert({
          where: {
            providerId_serviceItemId: {
              providerId: provider.providerProfile.id,
              serviceItemId: svc.id,
            },
          },
          update: {},
          create: {
            providerId: provider.providerProfile.id,
            serviceItemId: svc.id,
            price: svc.defaultPrice,
            unit: svc.unit,
            isEnabled: true,
          },
        }).catch(() => {});
      }
    }
  }
  console.log('✅ 创建5个测试陪玩账号: pw001~005 / test1234');

  // ==================== 7. 系统配置 ====================
  const configs = [
    { key: 'platform_name', value: '漫天星电竞', description: '平台名称' },
    { key: 'coin_name', value: '星石', description: '虚拟币名称' },
    { key: 'coin_exchange_rate', value: '10', description: '兑换比例（1元=多少星石）' },
    { key: 'platform_fee_rate', value: '20', description: '平台抽成比例（%）' },
    { key: 'min_withdraw', value: '100', description: '最低提现星石数' },
    { key: 'withdraw_fee_rate', value: '5', description: '提现手续费比例（%）' },
    { key: 'order_expire_hours', value: '2', description: '订单过期时间（小时）' },
  ];

  for (const cfg of configs) {
    await prisma.systemConfig.upsert({
      where: { key: cfg.key },
      update: {},
      create: cfg,
    });
  }
  console.log(`✅ 创建 ${configs.length} 条系统配置`);

  console.log('\n🎉 种子数据初始化完成！');
  console.log('\n📋 测试账号汇总：');
  console.log('  管理员: admin / admin123');
  console.log('  客服:   kefu001 / operator123');
  console.log('  老板:   boss001~003 / test1234');
  console.log('  陪玩:   pw001~005 / test1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
