import {ApiBearerAuth, ApiTags} from "@nestjs/swagger";
import {Body, Controller, Get, Post, UseGuards} from "@nestjs/common";
import {AuthService} from "./auth.service";
import {Throttle} from "@nestjs/throttler";
import {OtpRequestDto} from "./dto/otp-request.dto";
import {OtpVerifyDto} from "./dto/otp-verify.dto";
import {JwtAuthGuard} from "./jwt.guard";

//@ApiTags('auth') Swagger 里把这些接口归到 auth 组。
//@Controller('auth')：这组接口的前缀是 /auth/*。
@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) {
    }

    //限流，同一个客户端（默认按 IP）在 60 秒内最多 5 次，防刷接口
    // 限流按 req.ip 识别客户
    @Throttle({default: {limit: 5, ttl: 60_000}})
    @Post('otp/request')
    otpRequest(@Body() dto: OtpRequestDto) {
        return this.auth.requestOtp(dto);
    }

    @Post('otp/verify')
    otpVerify(@Body() dto: OtpVerifyDto) {
        return this.auth.verifyOtp(dto);
    }

    //@ApiBearerAuth()：告诉 Swagger 这个接口需要 Bearer 鉴权，文档页会出现“Authorize”按钮
    @ApiBearerAuth()
    //启用 JWT 守卫（自动从 Authorization: Bearer <token> 取 token、验签、验过期）。
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    me() {
        return this.auth.me();
    }
}