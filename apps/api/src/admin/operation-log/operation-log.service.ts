import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryOperationLogDto } from './dto/query-operation-log.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OperationLogService {
  constructor(private readonly prisma: PrismaService) {}

  async getList(query: QueryOperationLogDto) {
    const {
      page = 1,
      pageSize = 10,
      adminId,
      action,
      keyword,
      startDate,
      endDate,
    } = query;

    const where: Prisma.AdminOperationLogWhereInput = {};

    // Filter by adminIdx
    if (adminId) {
      where.adminId = adminId;
    }

    // Filter by action (operationType)
    if (action && action !== 'ALL') {
      where.action = action;
    }

    // Filter by keyword (search in adminName, details, module)
    if (keyword) {
      where.OR = [
        { adminName: { contains: keyword } },
        { details: { contains: keyword } },
        { module: { contains: keyword } },
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
          admin: {
            select: {
              id: true,
              username: true,
              realName: true,
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
