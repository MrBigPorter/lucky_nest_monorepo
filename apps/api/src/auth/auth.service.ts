import {PrismaService} from "../prisma/prisma.service";
import {JwtService} from "@nestjs/jwt";
import { md5} from "../common/crypto.util";
import { Injectable } from '@nestjs/common';
import {throwBiz} from "@api/common/exceptions/biz.exception";
import {ERROR_KEYS} from "@api/common/error-codes.gen";

const OTP_INTERVAL_SECONDS = Number(process.env.OTP_INTERVAL_SECONDS ?? 60);

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {
    }


    // 手机号登陆
    async loginWithOtp(phone: string, meta?: {ip?: string, ua?: string, countryCode?: number}){
        const p = phone.trim();
        const phoneMd5 = md5(p);

        const  now = new Date();
        // 毫秒
        const  graceStart = new Date(now.getTime() - OTP_INTERVAL_SECONDS * 1000);

        // // 取“最近一条已验证、且未消费”的登录 OTP
        const opt = await this.prisma.otpRequest.findFirst({
            where: {
                phoneMd5,
                purpose: 'LOGIN',
                verifiedAt: { not: null, gte: graceStart },
                consumedAt: null,
            },
            orderBy: { createdAt: 'desc'},
        })

        console.log('opt===>', opt);

        if (!opt){
            throwBiz(ERROR_KEYS.OTP_NOT_VERIFIED_OR_ALREADY_USED)
        }

        // 找或注册用户，登陆即注册（没有注册就注册，有注册就登陆）
        const user = await this.prisma.user.upsert({
            //用 唯一键 phone 查用户。这里要求 User 模型里 phone 是 @unique 或 @id。
            where: { phone: p },
            //如果没查到，就新建：
            create: {
                phone:p,
                phoneMd5,
                nickname: `pl_${Math.random().toString().slice(2, 10)}`,
                countryCode: meta?.countryCode,
            },
            update:{},
            //只返回这几个字段
            select: {
                id: true,
                phone: true,
                nickname: true,
                avatarUrl: true,
                phoneMd5: true,
                username: true,
                countryCode: true,
            }
        })

        //发JWT token
        const  accessToken = await this.jwt.signAsync({sub: user.id});

        //记录登陆成功
        await this.prisma.$transaction([
            this.prisma.loginEvent.create({
                data: {
                    userId: user.id,
                    method: 'OTP',
                    success: true,
                    tid: opt?.id ?? undefined,
                    ip: meta?.ip ?? null,
                    userAgent: meta?.ua ?? null,
                    countryCode: meta?.countryCode ?? null,
                }
            }),
            this.prisma.otpRequest.update({
                where: {id: opt?.id},
                data: { consumedAt: now }
            }),
            this.prisma.user.update({
                where: {id: user.id},
                data: { lastLoginAt: now }
            })
        ]);

        return {
            token: accessToken,
            id: user.id,
            phone: user.phone,
            phoneMd5: user.phoneMd5,
            nickname: user.nickname,
            userName: user.nickname,
            avatar: user.avatarUrl,
            countryCode: user.countryCode,
        };
    }

    // 获取用户信息
    async profile(userId: string){
        const  user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }});
        return {
            Id: user.id,
            nickname: user.nickname ?? `pl_${user.id}`,
            avatar: user.avatarUrl,
            phoneMd5: user.phoneMd5,
            phone: user.phone,
            invite_code: user.inviteCode ?? null,
            vip_level: user.vipLevel,
            last_login_at: user.lastLoginAt ? user.lastLoginAt.getTime() : null,
            kyc_status: mapKyc(user.kycStatus),
            delivery_address_id: 0,
            self_exclusion_expire_at: user.selfExclusionExpiresAt ? user.selfExclusionExpiresAt.getTime() : 0,
        }
    }
}

function mapKyc(k: any): number {
    const map: Record<string, number> = { PENDING: 0, REVIEW: 1, REJECTED: 2, APPROVED: 3, VERIFIED: 4 };
    return map[k] ?? 0;
}