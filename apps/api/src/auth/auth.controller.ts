import {ApiBearerAuth, ApiTags} from "@nestjs/swagger";
import {Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards} from "@nestjs/common";
import {AuthService} from "./auth.service";
import {OtpRequestDto} from "./dto/otp-request.dto";
import {OtpVerifyDto} from "./dto/otp-verify.dto";
import {JwtAuthGuard} from "./jwt.guard";
import {ok} from "../common/api-response";

//@ApiTags('auth') Swagger 里把这些接口归到 auth 组。
//@Controller('auth')：这组接口的前缀是 /auth/*。
@ApiTags('auth')
@Controller({path: 'auth', version: '1'})
export class AuthController {
    constructor(private readonly auth: AuthService) {
    }

    @Post('otp/request')
    @HttpCode(HttpStatus.OK)
    async request(@Body() dto: OtpRequestDto) {
        const data =  await this.auth.requestOtp(dto);
        return ok(data);
    }

    @Post('otp/verify')
    @HttpCode(HttpStatus.OK)
    async verify(@Body() dto: OtpVerifyDto) {
        const data = await this.auth.verifyOtp(dto);
        return ok(data);
    }

    //@ApiBearerAuth()：告诉 Swagger 这个接口需要 Bearer 鉴权，文档页会出现“Authorize”按钮
    @ApiBearerAuth()
    //启用 JWT 守卫（自动从 Authorization: Bearer <token> 取 token、验签、验过期）。
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async profile(@Req() req:any) {
      const  data = await  this.auth.profile(req.user.userId);
      return ok(data);
    }
}