# 漫天星电竞 - 陪玩管理平台

一套完整的陪玩业务管理系统，覆盖老板下单、陪玩抢单履约、运营派单审核、钱包结算、消息通知等全流程。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js + NestJS + TypeScript |
| ORM | Prisma |
| 数据库 | MySQL 8 + Redis |
| 实时通信 | Socket.IO (WebSocket) |
| 管理端 | Vue 3 + TypeScript + Element Plus + ECharts |
| 老板端 | Vue 3 + Vant UI (H5) |
| 陪玩端 | Vue 3 + Vant UI (H5) |
| 部署 | Docker + Docker Compose |

## 项目结构

```
mantianxing/
├── backend/              # 后端服务 (NestJS)
│   ├── src/
│   │   ├── modules/      # 业务模块
│   │   │   ├── auth/     # 认证（登录/注册/JWT）
│   │   │   ├── user/     # 用户
│   │   │   ├── provider/ # 陪玩
│   │   │   ├── order/    # 订单（状态机+抢单锁）
│   │   │   ├── wallet/   # 钱包（充值/提现/流水）
│   │   │   ├── game/     # 游戏与服务项目
│   │   │   ├── admin/    # 管理后台API
│   │   │   └── message/  # 消息（WebSocket）
│   │   ├── common/       # 公共（守卫/拦截器/工具）
│   │   ├── config/       # 配置（Redis）
│   │   ├── database/     # 数据库（Prisma）
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma # 数据库设计
│   │   └── seed.ts       # 种子数据
│   └── package.json
├── admin/                # 管理后台 (Vue3)
├── client/               # 老板端 H5 (Vue3)
├── provider/             # 陪玩端 H5 (Vue3)
├── docker-compose.yml    # MySQL + Redis
└── README.md
```

## 快速开始

### 1. 启动数据库（MySQL + Redis）

```bash
# 方式一：Docker（推荐）
docker-compose up -d

# 方式二：本地已安装 MySQL 和 Redis，直接使用即可
```

### 2. 配置环境变量

```bash
cd backend
cp .env.example .env
# 编辑 .env，修改数据库密码等配置
```

### 3. 安装依赖

```bash
cd backend
npm install
```

### 4. 初始化数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 执行数据库迁移（创建表）
npx prisma migrate dev --name init

# 导入种子数据（测试账号、游戏、服务项目）
npm run seed
```

### 5. 启动后端服务

```bash
# 开发模式（热更新）
npm run start:dev

# 生产模式
npm run build && npm run start:prod
```

服务启动后访问：http://localhost:3000/api

## 测试账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | admin | admin123 | 管理后台登录 |
| 客服 | kefu001 | operator123 | 客服运营 |
| 老板 | boss001 | test1234 | 下单测试，送10000星石 |
| 陪玩 | pw001 | test1234 | 接单测试 |

## 核心业务流程

```
老板下单 → 余额冻结 → 进入抢单池 → 陪玩抢单(Redis分布式锁)
→ 开始服务 → 提交报单(截图凭证) → 运营审核 → 审核通过
→ 结算(平台抽成20% + 陪玩收入) → 老板评价 → 完成
```

## 订单状态机

| 状态 | 说明 | 可操作角色 |
|------|------|-----------|
| CREATED | 已创建（待支付） | 老板 |
| PAID | 已支付（抢单池） | 陪玩可抢 |
| ASSIGNED | 已接单 | 陪玩开始服务 |
| SERVING | 服务中 | 陪玩提交报单 |
| REVIEWING | 待审核 | 运营审核 |
| COMPLETED | 已完成 | 老板评价 |
| CANCELLED | 已取消 | 退款 |
| EXPIRED | 已过期 | 退款 |
| DISPUTED | 申诉中 | 运营介入 |

## API 接口

所有接口前缀：`/api`

### 认证
- `POST /api/auth/register/customer` - 老板注册
- `POST /api/auth/register/provider` - 陪玩注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/profile` - 当前用户信息

### 订单
- `POST /api/order/create` - 创建订单
- `GET /api/order/pool` - 抢单池列表
- `POST /api/order/:id/grab` - 抢单
- `PUT /api/order/:id/start` - 开始服务
- `POST /api/order/:id/report` - 提交报单
- `PUT /api/order/:id/cancel` - 取消订单
- `GET /api/order/:id` - 订单详情

### 管理后台
- `GET /api/admin/dashboard` - 数据概览
- `GET /api/admin/users` - 用户列表
- `GET /api/admin/orders/review` - 报单审核列表
- `PUT /api/admin/orders/:id/approve` - 审核通过
- `PUT /api/admin/orders/:id/reject` - 审核驳回
- `POST /api/admin/wallet/recharge` - 手动充值
- `GET /api/admin/withdraw/list` - 提现审核列表

## 虚拟币说明

- 名称：**星石**
- 兑换比例：1元 = 10星石（可自行修改比例！）
- 所有金额以星石为单位存储（整数），避免浮点精度问题
- 平台抽成：20%（可自行修改）
- 最低提现：100星石（10元）（可自行修改）
- 提现手续费：5%（可自行修改）

## 注意事项

1. **生产环境**务必修改 `.env` 中的 `JWT_SECRET` 和数据库密码
2. 一期支付使用**后台手动充值**模式，二期接入微信/支付宝
3. MySQL 必须开启定时备份，Redis 开启 RDB + AOF 持久化
4. 2核2G服务器可跑 MySQL + Redis + 后端，建议升级到2核4G
5. 报单截图等文件建议使用阿里云OSS/腾讯云COS存储

## License

MIT
