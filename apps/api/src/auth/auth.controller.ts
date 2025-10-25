import {ApiBearerAuth, ApiOperation, ApiTags} from "@nestjs/swagger";
import {Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards} from "@nestjs/common";
import {AuthService} from "./auth.service";
import {JwtAuthGuard} from "./jwt.guard";
import {LoginOtpDto} from "./dto/login.dto";
import {Throttle} from '@nestjs/throttler';


//@ApiTags('auth') Swagger 里把这些接口归到 auth 组。
//@Controller('auth')：这组接口的前缀是 /auth/*。
@ApiTags('auth')
@Controller({path: 'auth', version: '1'})
export class AuthController {
    constructor(private readonly auth: AuthService) {}

    // 使用手机号登陆
    @Post('login/otp')
    @ApiOperation({ summary: 'login with OTP'})
    @Throttle({ otpRequest: { limit: 20, ttl: 60_000 } })
    @HttpCode(HttpStatus.OK)
    async loginWithOtp(@Body() dto: LoginOtpDto, @Req() req:any) {
        return await this.auth.loginWithOtp(dto.phone, {
          ip: req.ip,
          ua: req.headers['user-agent'],
          countryCode: req.headers['x-country-code']
      })
    }

    // 获取用户信息
    @ApiBearerAuth()
    //@ApiBearerAuth()：告诉 Swagger 这个接口需要 Bearer 鉴权，文档页会出现“Authorize”按钮
    //启用 JWT 守卫（自动从 Authorization: Bearer <token> 取 token、验签、验过期）。
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async profile(@Req() req:any) {
        return await this.auth.profile(req.user.userId)
    }
}