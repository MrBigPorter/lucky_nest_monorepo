import { PrismaService } from '@api/common/prisma/prisma.service';

import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AdminLoginDto } from '@api/client/auth/dto/admin-login.dto';
import { PasswordService } from '@api/common/service/password.service';

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
    private readonly passwordService: PasswordService,
  ) {}

  // sign access token
  private async issueToken(user: { id: string; role?: string }) {
    const payload: JwtPayload = { sub: user.id };

    if (user.role) {
      payload.role = user.role;
    }

    const expireIn = '12h';

    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: expireIn,
    });

    return {
      accessToken,
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
      await this.passwordService.compare(
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
    const isMatch = await this.passwordService.compare(
      password,
      admin.password,
    );
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
    const tokens = await this.issueToken({
      id: admin.id,
      role: admin.role,
    });

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
