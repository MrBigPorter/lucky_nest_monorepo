import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) {}

    @Post('register')
    async register(@Body() dto: RegisterDto) {
        const user = await this.auth.register(dto.email, dto.password);
        return user; // 不返回 hash
    }

    @Post('login')
    async login(@Body() dto: LoginDto) {
        const user = await this.auth.validate(dto.email, dto.password);
        return this.auth.issueToken(user);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    me() {
        return { ok: true };
    }
}