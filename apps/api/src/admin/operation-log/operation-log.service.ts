import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryOperationLogDto } from './dto/query-operation-log.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OperationLogService {
  constructor(private readonly prisma: PrismaService) {}

  async getList(query: QueryOperationLogDto) {
    const { page = 1, pageSize = 10, adminId, operationType, keyword, startDate, endDate } = query;

    const where: Prisma.AdminOperationLogWhereInput = {};

    // Filter by adminId
    if (adminId) {
      where.adminUserId = adminId;
    }

    // Filter by operationType
    if (operationType && operationType !== 'ALL') {
      where.operationType = operationType;
    }

    // Filter by keyword (search in description, targetId, adminUser.username)
    if (keyword) {
      where.OR = [
        { description: { contains: keyword } },
        { targetId: { contains: keyword } },
        { adminUser: { username: { contains: keyword } } },
      ];
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [list, total] = await Promise.all([
      this.prisma.adminOperationLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          adminUser: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.adminOperationLog.count({ where }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
    };
  }
}
