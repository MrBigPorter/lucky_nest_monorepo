import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Request } from 'express';
import { md5 } from '../common/crypto.util';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { throwBiz } from '@api/common/exceptions/biz.exception';
import { ERROR_KEYS } from '@api/common/error-codes.gen';
import {
  CODE_TYPE,
  LOGIN_METHOD,
  LOGIN_STATUS,
  LOGIN_TYPE,
  TOKEN_ISSUED,
  VERIFY_STATUS,
} from '@lucky/shared';
import { AdminLoginDto } from '@api/auth/dto/admin-login.dto';

// login validity window: 3 minutes
const OTP_LOGIN_WINDOW_SECONDS = Number(
  process.env.OTP_LOGIN_WINDOW_SECONDS ?? 300,
);

interface JwtPayload {
  sub: string;
  role?: string;
  type?: 'user' | 'admin';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // sign access token
  private async issueToken(
    user: { id: string; role?: string },
    withRefreshToken: boolean = true,
  ) {
    const payload: JwtPayload = { sub: user.id };

    if (user.role) {
      payload.role = user.role;
    }

    const expireIn = withRefreshToken ? '30m' : '12h';

    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: expireIn,
    });

    if (!withRefreshToken) {
      return { accessToken };
    }

    const refreshToken = await this.jwt.signAsync(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throwBiz(ERROR_KEYS.INVALID_JWT_TOKEN);
    }

    try {
      // check refresh token，if invalid, will throw error to catch block
      const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken);
      // check user existence
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true },
      });

      // user not found
      if (!user) {
        throwBiz(ERROR_KEYS.USER_NOT_FOUND);
      }

      // issue new tokens, return to client
      const tokens = await this.issueToken({ id: user!.id });

      return { tokens };
    } catch (e) {
      throwBiz(ERROR_KEYS.INVALID_JWT_TOKEN);
    }
  }

  // 手机号登陆(登录即注册)
  async loginWithOtp(
    phone: string,
    meta?: { ip?: string; ua?: string; countryCode?: number },
  ) {
    const p = phone.trim();
    const phoneMd5 = md5(p);

    const now = new Date();
    // 毫秒
    const graceStart = new Date(
      now.getTime() - OTP_LOGIN_WINDOW_SECONDS * 1000,
    );

    // // 取“最近一条已验证、且未消费”的登录 OTP
    const opt = await this.prisma.smsVerificationCode.findFirst({
      where: {
        phone: p,
        codeType: CODE_TYPE.LOGIN, // 2 登录
        verifiedAt: { not: null, gte: graceStart },
        verifyStatus: VERIFY_STATUS.VERIFIED, // 1 已验证
      },
      orderBy: { verifiedAt: 'desc' },
    });

    if (!opt) {
      throwBiz(ERROR_KEYS.OTP_NOT_VERIFIED_OR_ALREADY_USED);
    }

    // 交互式事务：原子消费 OTP + upsert 用户 + 日志 + 最后登录时间
    const user = await this.prisma.$transaction(async (ctx) => {
      // 1) 原子把 VERIFIED → CONSUMED，只允许成功一次
      const consumed = await ctx.smsVerificationCode.updateMany({
        where: { id: opt?.id, verifyStatus: VERIFY_STATUS.VERIFIED },
        data: { verifyStatus: VERIFY_STATUS.CONSUMED },
      });

      if (consumed.count != 1) {
        throwBiz(ERROR_KEYS.OTP_NOT_VERIFIED_OR_ALREADY_USED);
      }

      // 2) 登陆即注册
      const u = await ctx.user.upsert({
        //用 唯一键 phone 查用户。这里要求 User 模型里 phone 是 @unique 或 @id。
        where: { phone: p },
        //如果没查到，就新建：
        create: {
          phone: p,
          phoneMd5,
          nickname: `pl_${Math.random().toString().slice(2, 10)}`,
        },
        update: {},
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
        },
      });
      // 3) 登录日志
      await ctx.userLoginLog.create({
        data: {
          userId: u.id,
          loginType: LOGIN_TYPE.OTP,
          loginMethod: LOGIN_METHOD.OTP,
          loginStatus: LOGIN_STATUS.SUCCESS,
          tokenIssued: TOKEN_ISSUED.YES,
          loginTime: Date.now().toString(),
          loginIp: meta?.ip ?? null,
          userAgent: meta?.ua ?? null,
          countryCode: meta?.countryCode ? String(meta.countryCode) : null,
        },
      });

      // 4) 更新最后登录时间
      await ctx.user.update({
        where: { id: u.id },
        data: { lastLoginAt: now },
      });

      return u;
    });

    const tokens = await this.issueToken(user);

    return {
      tokens: tokens,
      id: user.id,
      phone: user.phone,
      phoneMd5: user.phoneMd5,
      nickname: user.nickname,
      username: user.nickname,
      avatar: user.avatar,
      countryCode: meta?.countryCode ?? null,
    };
  }

  // admin login
  async adminLogin(
    { username, password }: AdminLoginDto,
    ip: string,
    ua: string,
  ) {
    // check username
    const admin = await this.prisma.adminUser.findUnique({
      where: { username },
      select: {
        status: true,
        password: true,
        id: true,
        username: true,
        realName: true,
        role: true,
      },
    });

    const invalid = () =>
      new UnauthorizedException('invalid username or password');

    // check user
    if (!admin) {
      // mock password ,模拟耗时防止计时攻击-
      await bcrypt.compare(
        password,
        '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxwKc.60r.wwLs8BHlijROgM3.W9q',
      );
      await this.loginAuth(false, {
        username,
        ip,
        ua: ua,
        adminId: null,
      });
      throw invalid();
    }

    // verify password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      await this.loginAuth(false, {
        username,
        ip,
        ua: ua,
        adminId: admin.id,
      });
      throw invalid();
    }

    //  密码验证通过后，再检查状态
    // 这样黑客无法通过错误提示区分 "密码错" 还是 "账号被封"
    if (admin.status != 1) {
      await this.loginAuth(false, {
        username,
        ip,
        ua: ua,
        adminId: admin.id,
      });
      throw new BadRequestException('user is disabled, please contact admin');
    }

    //login success
    const result = await this.prisma.$transaction(async (ctx) => {
      // update login time
      const updatedUser = await ctx.adminUser.update({
        where: { id: admin.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIp: ip,
        },
      });

      // create login log
      await ctx.adminOperationLog.create({
        data: {
          adminId: admin.id,
          adminName: admin.realName || admin.username,
          module: 'auth',
          action: 'login',
          requestIp: ip,
          details: JSON.stringify({ msg: 'login success', ip, ua: ua }),
        },
      });
      return updatedUser;
    });

    // issue token
    const tokens = await this.issueToken(
      {
        id: admin.id,
        role: admin.role,
      },
      false,
    );

    return {
      tokens,
      userInfo: {
        id: result.id,
        username: result.username,
        realName: result.realName,
        role: result.role,
        status: result.status,
        lastLoginAt: result.lastLoginAt ? result.lastLoginAt.getTime() : null,
      },
    };
  }

  // admin logout
  async adminLogout(userId: string, ip: string, ua: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: userId },
      select: {
        username: true,
        realName: true,
        id: true,
      },
    });
    console.log('admin==>', admin);
    // record logout
    await this.prisma.adminOperationLog.create({
      data: {
        adminId: admin?.id ?? null,
        adminName: admin?.realName || admin?.username || '',
        module: 'auth',
        action: 'logout',
        requestIp: ip,
        details: JSON.stringify({ msg: 'logout success', ip, ua }),
      },
    });
    return { ok: true };
  }
  // 获取用户信息
  async profile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
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
      },
    });
    return {
      Id: user.id,
      nickname: user.nickname ?? `pl_${user.id}`,
      avatar: user.avatar,
      phoneMd5: user.phoneMd5,
      phone: user.phone,
      inviteCode: user.inviteCode ?? null,
      vipLevel: user.vipLevel,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.getTime() : null,
      kycStatus: mapKyc(user.kycStatus),
      deliveryAddress_id: 0,
      selfExclusionExpireAt: user.selfExclusionExpireAt
        ? user.selfExclusionExpireAt.getTime()
        : 0,
    };
  }

  private extractUa(req: Request) {
    const uaHeader = req.headers['user-agent'];
    return Array.isArray(uaHeader) ? uaHeader[0] : uaHeader;
  }

  private async loginAuth(
    ok: boolean,
    params: {
      adminId?: string | null;
      username: string;
      ip: string;
      ua?: string;
    },
  ) {
    await this.prisma.adminOperationLog.create({
      data: {
        adminId: params.adminId ?? undefined,
        adminName: params.username,
        module: 'auth',
        action: ok ? 'login' : 'login_fail',
        requestIp: params.ip,
        details: JSON.stringify({
          msg: ok ? 'login success' : 'login fail',
          ip: params.ip,
          ua: params.ua,
        }),
      },
    });
  }
}

function mapKyc(k: any): number {
  const map: Record<string, number> = {
    PENDING: 0,
    REVIEW: 1,
    REJECTED: 2,
    APPROVED: 3,
    VERIFIED: 4,
  };
  return map[k] ?? 0;
}
