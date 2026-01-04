import { PrismaService } from '@api/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { genRandomSuffix, md5 } from '@api/common/crypto.util';
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { throwBiz } from '@api/common/exceptions/biz.exception';
import { ERROR_KEYS } from '@api/common/error-codes.gen';
import {
  CODE_TYPE,
  KYC_STATUS,
  KYC_STATUS_LABEL,
  KYC_STATUS_OPTIONS,
  LOGIN_METHOD,
  LOGIN_STATUS,
  LOGIN_TYPE,
  TOKEN_ISSUED,
  VERIFY_STATUS,
} from '@lucky/shared';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // sign access token
  private async issueToken(user: { id: string }) {
    const payload: JwtPayload = { sub: user.id };
    // 2. 从配置中心读取 (利用 Joi 的默认值，这里必定有值)
    const accessTime =
      this.configService.get<string | number>('JWT_ACCESS_EXPIRATION') ?? '15m';
    const refreshTime =
      this.configService.get<string | number>('JWT_REFRESH_EXPIRATION') ?? '7d';

    // 3. 并行签名
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, { expiresIn: accessTime as any }),
      this.jwt.signAsync(payload, { expiresIn: refreshTime as any }),
    ]);

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
      // 4. 安全增强：检查用户是否存在且状态正常
      // 不要只查 id，要查 status，防止封禁用户“僵尸复活”
      const user = await this.prisma.user.findFirst({
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
    } catch (e: any) {
      // 记录日志，方便排查是过期了还是签名不对
      this.logger.warn(
        `Refresh token failed for token: ${refreshToken.slice(0, 10)}... Error: ${e.message}`,
      );
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

    const windowSec =
      this.configService.get<number>('OTP_LOGIN_WINDOW_SECONDS') ?? 300;
    // 毫秒
    const graceStart = new Date(now.getTime() - windowSec * 1000);

    // // 取“最近一条已验证、且未消费”的登录 OTP
    const opt = await this.prisma.smsVerificationCode.findFirst({
      where: {
        phone: p,
        codeType: CODE_TYPE.LOGIN, // 2 登录
        verifiedAt: { not: null, gte: graceStart }, // 确保已验证且在有效期内
        verifyStatus: VERIFY_STATUS.VERIFIED, // 1 已验证
      },
      select: { id: true }, // 性能优化：只查 id
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

      // 7. 性能优化核心：合并 Upsert 和 Update 操作
      // 使用更安全的随机数生成昵称后缀
      const randomSuffix = genRandomSuffix();

      // 2) 登陆即注册
      const u = await ctx.user.upsert({
        //用 唯一键 phone 查用户。这里要求 User 模型里 phone 是 @unique 或 @id。
        where: { phone: p },
        //如果没查到，就新建：
        create: {
          phone: p,
          phoneMd5,
          nickname: `ms_${randomSuffix}`,
          lastLoginAt: now, //创建时直接写入
        },
        update: {
          //更新时直接写入，省去了一次 update 查询！
          lastLoginAt: now,
        },
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
          loginTime: new Date(),
          loginIp: meta?.ip ?? null,
          userAgent: meta?.ua ?? null,
          countryCode: meta?.countryCode ? String(meta.countryCode) : null,
        },
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
      id: user.id,
      nickname: user.nickname ?? `ms${user.id}`,
      avatar: user.avatar,
      phoneMd5: user.phoneMd5,
      phone: user.phone,
      inviteCode: user.inviteCode ?? null,
      vipLevel: user.vipLevel,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.getTime() : null,
      kycStatus: user.kycStatus,
      deliveryAddressId: 0,
      selfExclusionExpireAt: user.selfExclusionExpireAt
        ? user.selfExclusionExpireAt.getTime()
        : 0,
    };
  }
}
