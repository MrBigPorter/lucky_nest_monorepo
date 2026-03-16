import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { QueryLoginLogDto } from './dto/query-login-log.dto';

@Injectable()
export class LoginLogService {
  constructor(private readonly prisma: PrismaService) {}

  async getList(dto: QueryLoginLogDto) {
    const {
      page = 1,
      pageSize = 20,
      userId,
      loginIp,
      loginMethod,
      loginStatus,
      startDate,
      endDate,
    } = dto;

    const where: Prisma.UserLoginLogWhereInput = {};

    if (userId) where.userId = userId;
    if (loginIp) where.loginIp = { contains: loginIp };
    if (loginMethod) where.loginMethod = loginMethod;
    if (loginStatus !== undefined) where.loginStatus = loginStatus;
    if (startDate || endDate) {
      where.loginTime = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    const [total, list] = await Promise.all([
      this.prisma.userLoginLog.count({ where }),
      this.prisma.userLoginLog.findMany({
        where,
        orderBy: { loginTime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, nickname: true, avatar: true } },
        },
      }),
    ]);

    return {
      list: list.map((log) => ({
        id: log.id,
        userId: log.userId,
        userNickname: log.user?.nickname ?? null,
        userAvatar: log.user?.avatar ?? null,
        loginTime: log.loginTime.getTime(),
        loginType: log.loginType,
        loginMethod: log.loginMethod,
        loginIp: log.loginIp,
        loginDevice: log.loginDevice,
        countryCode: log.countryCode,
        city: log.city,
        loginStatus: log.loginStatus,
        failReason: log.failReason,
        tokenIssued: log.tokenIssued,
      })),
      total,
      page,
      pageSize,
    };
  }
}
