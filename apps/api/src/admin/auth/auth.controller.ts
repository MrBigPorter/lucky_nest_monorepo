import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { CurrentUserId } from '@api/common/decorators/user.decorator';
import { RealIp, UserAgent } from '@api/common/decorators/http.decorators';
import { AdminLoginDto } from './dto/admin-login.dto';
import { SetCookieDto } from './dto/set-cookie.dto';

@ApiTags('admin Auth Management')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * Admin login
   * @param dto
   * @param ip
   * @param ua
   */
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async loginAdmin(
    @Body() dto: AdminLoginDto,
    @RealIp() ip: string,
    @UserAgent() ua: string,
  ) {
    return this.auth.adminLogin(dto, ip, ua);
  }

  /**
   * Admin logout
   */
  @Post('admin/logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logoutAdmin(
    @CurrentUserId() userId: string,
    @RealIp() ip: string,
    @UserAgent() ua: string,
  ) {
    return this.auth.adminLogout(userId, ip, ua);
  }

  /**
   * 设置 HTTP-only auth_token Cookie
   * 前端登录成功后调用此接口，由后端设置 HttpOnly Cookie（JS 无法读取，防 XSS）
   */
  @Post('admin/set-cookie')
  @HttpCode(HttpStatus.OK)
  async setAuthCookie(
    @Body() dto: SetCookieDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.verifyAdminToken(dto.token);

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('auth_token', dto.token, {
      httpOnly: true,
      secure: isProd,          // 生产用 HTTPS，本地开发允许 HTTP
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 小时（ms）
      path: '/',
    });

    return { ok: true };
  }

  /**
   * 清除 HTTP-only auth_token Cookie（登出时调用）
   */
  @Post('admin/clear-cookie')
  @HttpCode(HttpStatus.OK)
  async clearAuthCookie(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('auth_token', { path: '/' });
    return { ok: true };
  }
}
