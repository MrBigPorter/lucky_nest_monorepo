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
  Post, Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { CurrentUserId } from '@api/common/decorators/user.decorator';
import { AdminLoginDto } from '@api/client/auth/dto/admin-login.dto';
import { ReaIp, UserAgent } from '@api/common/decorators/http.decorators';

//@ApiTags('auth') Swagger 里把这些接口归到 auth 组。
//@Controller('auth')：这组接口的前缀是 /auth/*。
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async loginAdmin(
    @Body() dto: AdminLoginDto,
    @ReaIp() ip: string,
    @UserAgent() ua: string,
  ) {
    return this.auth.adminLogin(dto, ip, ua);
  }

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
