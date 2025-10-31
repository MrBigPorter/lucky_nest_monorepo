import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import {md5} from "@api/common/crypto.util";

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}


    async create(data: CreateUserDto) {
        const phone = data.phone.trim();
        const phoneMd5 = md5(phone);

        return this.prisma.user.create({
            data: {
                phone: data.phone,
                phoneMd5,
                nickname: data.nickname ?? `pl_${Math.random().toString().slice(2, 10)}`,
            },
        });
    }
}