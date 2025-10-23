import {BadRequestException, Injectable, UnauthorizedException} from "@nestjs/common";
import {PrismaService} from "../prisma/prisma.service";
import {JwtService} from "@nestjs/jwt";
import {createHash,randomInt} from "node:crypto";
import {OtpRequestDto} from "./dto/otp-request.dto";
import { addMinutes, isBefore } from 'date-fns';
import {OtpVerifyDto} from "./dto/otp-verify.dto";

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {
    }

    private  hashOtp(code: string) {
        return createHash('sha256').update(code).digest('hex');
    }

    // 发送验证码 send code
    async requestOtp({phone,countryCode}:OtpRequestDto){
        const isProd = process.env.NODE_ENV === 'production'

        //开发环境固定验证码
        const fixedDevOtp = process.env.OTP_DEV_CODE || '999999';

        const  code = isProd ?('' + randomInt(0,1_000_000)).padStart(6, '0') : fixedDevOtp;

        const p = phone.trim();
        const phoneMd5 = createHash('md5').update(p).digest('hex');

        await this.prisma.otpRequest.create({
            data: {
                purpose:'LOGIN',
                phone: p,
                phoneMd5,
                otpHash:this.hashOtp(code),
                expiresAt:addMinutes(new Date(),5),
                attempts:0,
                channel:'console'
            }
        })

        // 发送短信：先用 console 模拟
        // 生产可接短信厂商，这里为了联调返回 code（仅开发环境）
        // 开发环境把验证码直接返回，方便调试；生产环境一定不要返回
        console.log(`env: ${process.env.NODE_ENV} send code: ${code} to ${p}`)
        const devCode = process.env.NODE_ENV === 'production' ? undefined : code;
        return { ok: true, devCode,  phone: p, countryCode: countryCode ?? null, };
    }

    // 验证code verify code
    async verifyOtp({phone,code}: OtpVerifyDto){

        const p = phone.trim();
        const phoneMd5 = createHash('md5').update(p).digest('hex');

        const req = await this.prisma.otpRequest.findFirst({
            where: { phoneMd5, purpose: 'LOGIN'},
            orderBy: { createdAt: 'desc'}
        });

        if (!req) throw new BadRequestException('Otp not found');
        if (isBefore(req.expiresAt, new Date())) throw new BadRequestException('Otp expired');

        const ok = req.otpHash  === this.hashOtp(code);
        // 记录尝试次数
        if (!ok) {
            await this.prisma.otpRequest.update({
                where: {id: req.id},
                data: { attempts: { increment: 1}}
            })
            throw new UnauthorizedException('Invalid code');
        }

        //标记 OTP 已使用：验证成功后把本条记录 verifiedAt 更新，避免重复使用
        await this.prisma.otpRequest.update({
            where: {id: req.id},
            data: { verifiedAt: new Date()}
        })
        // user 用户
        const user = await  this.prisma.user.upsert({
            where: { phone: p},
            update: { lastLoginAt: new Date()},
            create: {
                phone: p,
                phoneMd5,
                vipLevel: 0,
                kycStatus: 'PENDING',
                lastLoginAt: new Date()
            }
        });

        let nickname = user.nickname ?? `pl_${user.id}`
       // 首次创建时可能没有 nickname，这里补一次（幂等）
        if (!user.nickname){
            await this.prisma.user.update({
                where: { id: user.id},
                data: {nickname: nickname }
            })
        }

        // 登陆事件
        await  this.prisma.loginEvent.create({
            data: { userId: user.id, method: 'OTP', success: true, countryCode: user.countryCode ?? null }
        })

       // verifyOtp 里签发 token
        const accessToken = await this.jwt.signAsync({sub: user.id});
        return {
            accessToken,
            user:{
                id: user.id,
                phone: user.phone,
                nickname: user.nickname
            }
        };
    }

    me(){
        return {ok: true};
    }
}