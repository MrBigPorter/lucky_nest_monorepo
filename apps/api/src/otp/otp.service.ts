import {BadRequestException, Injectable, UnauthorizedException} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import * as crypto from 'node:crypto';
import {gen6Code, md5, sha256} from "../common/crypto.util";
import {addSeconds, isBefore} from 'date-fns';
import {throwBiz} from "@api/common/exceptions/biz.exception";
import {ERROR_KEYS} from "@api/common/error-codes.gen";

const OTP_PEPPER = process.env.OTP_PEPPER || '';
const OTP_TTL_SECONDS = Number(process.env.OTP_TTL_SECONDS) || 300;
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS) || 5;
const OTP_INTERVAL_SECONDS = Number(process.env.OTP_INTERVAL_SECONDS) || 60;
const isProd = process.env.NODE_ENV === 'production'

@Injectable()
export class OtpService {
    constructor(private readonly prisma: PrismaService) {
    }


    // 仅开发环境：打印验证码；以后可接供应商 SDK
    private async sendSmsDev(phone: string, code: string) {
        // eslint-disable-next-line no-console
        console.log(`[DEV SMS] to ${phone}: code=${code}`);
        return code
    }

    // 1) 请求验证码
    async request({phone}: { phone: string }) {
        const p = phone.trim();
        const phoneMd5 = md5(p);
        if (!p) throw new BadRequestException({'message': 'phone required'});

        // DB 限流：同手机号最近 OTP_INTERVAL_SECONDS 内只能申请一次
        const recent = await this.prisma.otpRequest.findFirst({
            where: {
                phoneMd5,
                purpose: 'LOGIN',
                createdAt: {gte: new Date(Date.now() - OTP_INTERVAL_SECONDS * 1000)},
            },
            select: {id: true}
        })

        if (recent) {
            throwBiz(ERROR_KEYS.TOO_MANY_REQUESTS)

        }

        //开发环境固定验证码
        const code = isProd ? gen6Code() : (process.env.OTP_DEV_CODE ?? '999999');
        const otpHash = sha256(`${p}:${code}${OTP_PEPPER}`);
        const expiresAt = addSeconds(new Date(), OTP_TTL_SECONDS);
        const tid = crypto.randomUUID();

        // 入库（purpose=LOGIN）
        await this.prisma.otpRequest.create({
            data: {
                tid,
                purpose: 'LOGIN',
                phone: p,
                phoneMd5,
                otpHash,
                expiresAt,
                attempts: 0,
                channel: 'sms',
            },
        });

        if (!isProd) {
            await this.sendSmsDev(p, code);
            return { devCode: code};
        }

        // TODO: 生产环境在这里调用供应商 SDK 发送短信
        return {tid};
    }

    // 2) 校验验证码（仅校验，不发 token）
    async verify({phone, code}: { phone: string; code: string }) {
        const p = (phone || '').trim();
        const c = (code || '').trim();
        const phoneMd5 = md5(p);
        if (!p || !c) throw new BadRequestException('phone required');


        // 找“最新的一条 LOGIN OTP”
        const req = await this.prisma.otpRequest.findFirst({
            where: {phoneMd5, purpose: 'LOGIN'},
            orderBy: {createdAt: 'desc'},
        });

        if (!req) throw new BadRequestException('Otp not found');
        if (isBefore(req.expiresAt, new Date())) throwBiz(ERROR_KEYS.OTP_EXPIRED);
        if (req.attempts >= OTP_MAX_ATTEMPTS) throwBiz(ERROR_KEYS.TOO_MANY_OTP_ATTEMPTS);


        const expectOtpHash = req.otpHash;
        const actualOtpHash = sha256(`${p}:${code}${OTP_PEPPER}`);
        const isMatch = expectOtpHash === actualOtpHash;


        // 记录尝试次数
        await this.prisma.otpRequest.update({
            where: {id: req.id},
            data: {
                attempts: req.attempts + (isMatch ? 0 : 1),
                verifiedAt: isMatch ? new Date() : req.verifiedAt,
            },
        })

        if (!isMatch) {
            throw new UnauthorizedException('Invalid code');
        }

        return '9999'
    }
}