import {PrismaService} from "../prisma/prisma.service";
import {JwtService} from "@nestjs/jwt";
import { md5} from "../common/crypto.util";
import { Injectable } from '@nestjs/common';
import {throwBiz} from "@api/common/exceptions/biz.exception";
import {ERROR_KEYS} from "@api/common/error-codes.gen";
import {CODE_TYPE, LOGIN_METHOD, LOGIN_STATUS, LOGIN_TYPE, TOKEN_ISSUED, VERIFY_STATUS} from "@lucky/shared";

// login validity window: 3 minutes
const OTP_LOGIN_WINDOW_SECONDS = Number(process.env.OTP_LOGIN_WINDOW_SECONDS ?? 300);

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {
    }

    // sign access token
    private async issueToken(user: { id: string;}){
        const  payload = {sub: user.id};

        const  accessToken = await this.jwt.signAsync(payload, {
            expiresIn: '30m',
        });

        const  refreshToken = await this.jwt.signAsync(payload, {
            expiresIn: '7d',
        })

        return {
            accessToken,
            refreshToken,
        }
    }

    // 手机号登陆(登录即注册)
    async loginWithOtp(phone: string, meta?: {ip?: string, ua?: string, countryCode?: number}){
        const p = phone.trim();
        const phoneMd5 = md5(p);


        const  now = new Date();
        // 毫秒
        const  graceStart = new Date(now.getTime() - OTP_LOGIN_WINDOW_SECONDS * 1000);


        // // 取“最近一条已验证、且未消费”的登录 OTP
        const opt = await this.prisma.smsVerificationCode.findFirst({
            where: {
                phone:p,
                codeType: CODE_TYPE.LOGIN, // 2 登录
                verifiedAt: { not: null, gte: graceStart },
                verifyStatus: VERIFY_STATUS.VERIFIED, // 1 已验证
            },
            orderBy: { verifiedAt: 'desc'},
        })



        if (!opt){
            throwBiz(ERROR_KEYS.OTP_NOT_VERIFIED_OR_ALREADY_USED)
        }

        // 交互式事务：原子消费 OTP + upsert 用户 + 日志 + 最后登录时间
        const  user = await this.prisma.$transaction(async (ctx: { smsVerificationCode: { updateMany: (arg0: { where: { id: any; verifyStatus: 1; }; data: { verifyStatus: 2; }; }) => any; }; })=>{
            // 1) 原子把 VERIFIED → CONSUMED，只允许成功一次
            const  consumed = await ctx.smsVerificationCode.updateMany({
                where:{id:opt?.id,verifyStatus:VERIFY_STATUS.VERIFIED},
                data:{verifyStatus:VERIFY_STATUS.CONSUMED}
            })

            if (consumed.count != 1){
                throwBiz(ERROR_KEYS.OTP_NOT_VERIFIED_OR_ALREADY_USED)
            }

            // 2) 登陆即注册
            const u = await this.prisma.user.upsert({
                //用 唯一键 phone 查用户。这里要求 User 模型里 phone 是 @unique 或 @id。
                where: { phone: p },
                //如果没查到，就新建：
                create: {
                    phone:p,
                    phoneMd5,
                    nickname: `pl_${Math.random().toString().slice(2, 10)}`,
                },
                update:{},
                //只返回这几个字段
                select: {
                    id: true,
                    phone: true,
                    nickname: true,
                    avatar: true,
                    phoneMd5: true,
                    inviteCode: true,
                    vipLevel: true,
                    lastLoginAt: true,
                    kycStatus: true,
                    selfExclusionExpireAt: true,
                }
            })
           // 3) 登录日志
            this.prisma.userLoginLog.create({
                data: {
                    userId: u.id,
                    loginType: LOGIN_TYPE.OTP,
                    loginMethod:LOGIN_METHOD.OTP,
                    loginStatus:LOGIN_STATUS.SUCCESS,
                    tokenIssued: TOKEN_ISSUED.YES,
                    loginTime: Date.now().toString(),
                    loginIp: meta?.ip ?? null,
                    userAgent: meta?.ua ?? null,
                    countryCode: meta?.countryCode ? String(meta.countryCode) : null,

                }
            });

              // 4) 更新最后登录时间
                this.prisma.user.update({
                    where: {id: u.id},
                    data: { lastLoginAt: now }
                })

            return u;

        })


        const tokens = await this.issueToken(user);

        return {
            tokens: tokens,
            id: user.id,
            phone: user.phone,
            phone_md5: user.phoneMd5,
            nickname: user.nickname,
            username: user.nickname,
            avatar: user.avatar,
            country_code: meta?.countryCode ?? null,
        };
    }

    // 获取用户信息
    async profile(userId: string){
        const  user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: {
                id: true,
                phone: true,
                phoneMd5: true,
                nickname: true,
                avatar: true,
                inviteCode: true,
                vipLevel: true,
                lastLoginAt: true,
                kycStatus: true,
                selfExclusionExpireAt: true,
            }
        });
        return {
            Id: user.id,
            nickname: user.nickname ?? `pl_${user.id}`,
            avatar: user.avatar,
            phone_md5: user.phoneMd5,
            phone: user.phone,
            invite_code: user.inviteCode ?? null,
            vip_level: user.vipLevel,
            last_login_at: user.lastLoginAt ? user.lastLoginAt.getTime() : null,
            kyc_status: mapKyc(user.kycStatus),
            delivery_address_id: 0,
            self_exclusion_expire_at: user.selfExclusionExpireAt ? user.selfExclusionExpireAt.getTime() : 0,
        }
    }
}

function mapKyc(k: any): number {
    const map: Record<string, number> = { PENDING: 0, REVIEW: 1, REJECTED: 2, APPROVED: 3, VERIFIED: 4 };
    return map[k] ?? 0;
}