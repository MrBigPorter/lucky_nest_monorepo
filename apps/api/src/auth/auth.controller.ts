// apps/api/src/auth/auth.controller.ts
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
        // ✅ 改为 phone
        const user = await this.auth.register(dto.phone, dto.password, dto.nickname);
        return user; // 不返回 hash
    }

    @Post('login')
    async login(@Body() dto: LoginDto) {
        // ✅ 改为 phone
        const user = await this.auth.validate(dto.phone, dto.password);
        return this.auth.issueToken({ id: user.id, phone: user.phone });
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    me() {
        return { ok: true };
    }
}