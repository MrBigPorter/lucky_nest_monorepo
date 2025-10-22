import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    findByPhone(phone: string) {
        return this.prisma.user.findUnique({ where: { phone } });
    }

    async create(data: CreateUserDto) {
        const phoneMd5 = createHash('md5').update(data.phone).digest('hex');
        const passwordHash = await bcrypt.hash(data.password, 10);

        return this.prisma.user.create({
            data: {
                phone: data.phone,
                phoneMd5,
                nickname: data.nickname,
                credentials: { create: { passwordHash } },
            },
            include: { credentials: true },
        });
    }
}