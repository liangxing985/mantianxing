import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // 用户注册
  async register(dto: {
    username: string;
    password: string;
    nickname: string;
    phone?: string;
    role?: Role;
  }) {
    // 检查用户名是否存在
    const existUser = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existUser) {
      throw new ConflictException('用户名已存在');
    }

    // 检查手机号
    if (dto.phone) {
      const existPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existPhone) {
        throw new ConflictException('手机号已被注册');
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: hashedPassword,
        nickname: dto.nickname,
        phone: dto.phone,
        role: dto.role || Role.CUSTOMER,
        // 自动创建钱包
        wallet: {
          create: {},
        },
        // 如果注册为陪玩，自动创建陪玩资料
        ...(dto.role === Role.PROVIDER
          ? {
              providerProfile: {
                create: {
                  applyStatus: 'PENDING',
                },
              },
            }
          : {}),
      },
      include: {
        wallet: true,
        providerProfile: true,
      },
    });

    this.logger.log(`用户注册成功: ${user.username} (${user.role})`);

    return this.generateToken(user);
  }

  // 用户登录
  async login(dto: { username: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      include: { wallet: true, providerProfile: true },
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('账号已被禁用，请联系客服');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 更新最后登录时间
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`用户登录: ${user.username}`);

    return this.generateToken(user);
  }

  // 生成JWT Token
  private generateToken(user: any) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
        phone: user.phone,
        isVerified: user.isVerified,
        wallet: user.wallet
          ? {
              balance: user.wallet.balance,
              frozen: user.wallet.frozen,
            }
          : null,
        providerProfile: user.providerProfile
          ? {
              level: user.providerProfile.level,
              rating: user.providerProfile.rating,
              isOnline: user.providerProfile.isOnline,
              acceptOrder: user.providerProfile.acceptOrder,
              applyStatus: user.providerProfile.applyStatus,
            }
          : null,
      },
    };
  }

  // 验证用户（JWT策略用）
  async validateUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true, providerProfile: true },
    });
    if (!user || user.status !== 'ACTIVE') {
      return null;
    }
    return user;
  }
}
