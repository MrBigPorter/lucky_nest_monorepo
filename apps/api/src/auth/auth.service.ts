import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly users: UsersService,
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
    ) {}

    async register(email: string, password: string) {
        const exist = await this.users.findByEmail(email);
        if (exist) throw new ConflictException('Email already registered');
        const hash = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({ data: { email, password: hash } });
        return { id: user.id, email: user.email };
    }

    async validate(email: string, pass: string) {
        const user = await this.users.findByEmail(email);
        if (!user) throw new UnauthorizedException();
        const ok = await bcrypt.compare(pass, user.password);
        if (!ok) throw new UnauthorizedException();
        return { id: user.id, email: user.email };
    }

    async issueToken(user: { id: string; email: string }) {
        const payload = { sub: user.id, email: user.email };
        return {
            accessToken: await this.jwt.signAsync(payload),
        };
    }
}