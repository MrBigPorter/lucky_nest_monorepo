import {BadRequestException, HttpException, HttpStatus, Injectable, UnauthorizedException} from "@nestjs/common";
import {PrismaService} from "../prisma/prisma.service";
import {JwtService} from "@nestjs/jwt";
import {createHash,randomInt} from "node:crypto";
import {OtpRequestDto} from "./dto/otp-request.dto";
import { addMinutes, isBefore } from 'date-fns';
import {OtpVerifyDto} from "./dto/otp-verify.dto";
import {gen6Code, md5, sha256} from "../common/crypto.util";

const OTP_TTL_SECONDS = Number(process.env.OTP_TTL_SECONDS) || 300;
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS) || 5;
const OTP_INTERVAL_SECONDS = Number(process.env.OTP_INTERVAL_SECONDS) || 60;
const OTP_PEPPER = process.env.OTP_PEPPER || '';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {
    }

    // 1) 申请验证码（限流 + 仅存哈希）
    async requestOtp({phone,countryCode}:OtpRequestDto){
        const isProd = process.env.NODE_ENV === 'production'


        const p = phone.trim();
        const phoneMd5 = md5(p);

        // 简单频率限制：同手机号最近 OTP_INTERVAL_SECONDS 内只能申请一次
        // gte = 大于等于：只看“在过去 OTP_INTERVAL_SECONDS 秒内”产生的记录
        const  recent = await this.prisma.otpRequest.findFirst({
            where: { phoneMd5, purpose: 'LOGIN', createdAt: { gte: new Date(Date.now() - OTP_INTERVAL_SECONDS * 1000)} },
            orderBy: {createdAt: 'desc'},
            select: {id:true}
        })

        if(recent) throw new HttpException('Try again later', HttpStatus.TOO_MANY_REQUESTS);

        //开发环境固定验证码
        const fixedDevOtp = process.env.OTP_DEV_CODE || '999999';

        const  code = isProd ? gen6Code() : fixedDevOtp;
        const otpHash = sha256(`${p}:${code}${OTP_PEPPER}`);
        const expiresAt = addMinutes(new Date(), OTP_TTL_SECONDS);

        await this.prisma.otpRequest.create({
            data: {
                purpose:'LOGIN',
                phone: p,
                phoneMd5,
                otpHash,
                expiresAt: expiresAt,
                attempts:0,
                tid: null,
                channel:'console'
            }
        })

        // 发送短信：先用 console 模拟
        // 生产可接短信厂商，这里为了联调返回 code（仅开发环境）
        // 开发环境把验证码直接返回，方便调试；生产环境一定不要返回
        const devCode = isProd ? undefined : code;
        return { ok: true, devCode,  phone: p, countryCode: countryCode ?? null, };
    }

    // 2) 校验验证码 → 登录即注册 → 签发 JWT → 记录 LoginEvent
    async verifyOtp({phone,code}: OtpVerifyDto){

        const p = phone.trim();
        const phoneMd5 = md5(p);

        const req = await this.prisma.otpRequest.findFirst({
            where: { phoneMd5, purpose: 'LOGIN'},
            orderBy: { createdAt: 'desc'}
        });

        if (!req) throw new BadRequestException('Otp not found');
        if (isBefore(req.expiresAt, new Date())) throw new BadRequestException('Otp expired');
        if (req.attempts >= OTP_MAX_ATTEMPTS) throw new UnauthorizedException('Too many attempts');


        const expectOtpHash = req.otpHash;
        const actualOtpHash = sha256(`${p}:${code}${OTP_PEPPER}`);
        const  isMatch = expectOtpHash === actualOtpHash;


        //标记 OTP 已使用：验证成功后把本条记录 verifiedAt 更新，避免重复使用
        if (!isMatch) {
            // 记录尝试次数
            await this.prisma.otpRequest.update({
                where: {id: req.id},
                data: { attempts: req.attempts + 1},
            })
            throw new UnauthorizedException('Invalid code');
        }

        // 成功：只标记通过时间（避免重复使用）
        await this.prisma.otpRequest.update({
            where: {id: req.id},
            data: { verifiedAt: new Date()}
        })

        return '9999';
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