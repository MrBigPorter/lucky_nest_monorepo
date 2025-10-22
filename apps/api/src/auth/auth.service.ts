// apps/api/src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly users: UsersService,
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
    ) {}

    private md5(s: string) {
        return createHash('md5').update(s).digest('hex');
    }

    async register(phone: string, password: string, nickname?: string) {
        const exist = await this.users.findByPhone(phone);
        if (exist) throw new ConflictException('Phone already registered');

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: {
                phone,
                phoneMd5: this.md5(phone),
                nickname,
                credentials: { create: { passwordHash } },
            },
            select: { id: true, phone: true, nickname: true },
        });
        return user;
    }

    async validate(phone: string, pass: string) {
        const user = await this.prisma.user.findUnique({
            where: { phone },
            include: { credentials: true },
        });
        if (!user || !user.credentials?.passwordHash) throw new UnauthorizedException();

        const ok = await bcrypt.compare(pass, user.credentials.passwordHash);
        if (!ok) throw new UnauthorizedException();

        return { id: user.id, phone: user.phone, nickname: user.nickname ?? null };
    }

    async issueToken(user: { id: string; phone: string }) {
        const payload = { sub: user.id };
        return { accessToken: await this.jwt.signAsync(payload) };
    }
}