import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { CurrentUserId } from '@api/common/decorators/user.decorator';
import { AdminLoginDto } from '@api/client/auth/dto/admin-login.dto';
import { ReaIp, UserAgent } from '@api/common/decorators/http.decorators';

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
    @ReaIp() ip: string,
    @UserAgent() ua: string,
  ) {
    return this.auth.adminLogin(dto, ip, ua);
  }

  /**
   * Admin logout
   * @param userId
   * @param ip
   * @param ua
   */
  @Post('admin/logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logoutAdmin(
    @CurrentUserId() userId: string,
    @ReaIp() ip: string,
    @UserAgent() ua: string,
  ) {
    return this.auth.adminLogout(userId, ip, ua);
  }
}
