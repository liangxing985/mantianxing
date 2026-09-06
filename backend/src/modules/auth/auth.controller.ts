import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 老板注册
  @Post('register/customer')
  async registerCustomer(@Body() dto: RegisterDto) {
    return this.authService.register({
      ...dto,
      role: 'CUSTOMER',
    });
  }

  // 陪玩注册（入驻申请）
  @Post('register/provider')
  async registerProvider(@Body() dto: RegisterDto) {
    return this.authService.register({
      ...dto,
      role: 'PROVIDER',
    });
  }

  // 登录（所有角色通用）
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // 获取当前用户信息
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      phone: user.phone,
      isVerified: user.isVerified,
      bio: user.bio,
      gender: user.gender,
      wallet: user.wallet
        ? {
            balance: user.wallet.balance,
            frozen: user.wallet.frozen,
            totalIncome: user.wallet.totalIncome,
          }
        : null,
      providerProfile: user.providerProfile || null,
    };
  }
}
