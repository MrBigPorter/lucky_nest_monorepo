import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { QueryKycDto } from '@api/admin/kyc/dto/query-kyc.dto';
import { Prisma } from '@prisma/client';
import {
  KYC_STATUS,
  KycOpAction,
  KycStatus,
  OP_ACTION,
  OP_MODULE,
  OpAction,
  OpModule,
  TimeHelper,
} from '@lucky/shared';
import { AuditKycDto } from '@api/admin/kyc/dto/audit-kyc.dto';

@Injectable()
export class KycService {
  constructor(private prismaService: PrismaService) {}

  /**
   * Get KYC record list with pagination and filters
   * @param dto
   */
  async getKycRecordList(dto: QueryKycDto) {
    const {
      page = 1,
      pageSize = 20,
      kycStatus,
      userId,
      endDate,
      startDate,
    } = dto;

    const skip = (page - 1) * pageSize;
    const whereConditions: Prisma.KycRecordWhereInput = {};
    if (kycStatus) {
      whereConditions.kycStatus = kycStatus;
    }
    if (userId) {
      whereConditions.userId = userId;
    }

    if (startDate || endDate) {
      whereConditions.createdAt = {
        ...(startDate ? { gte: TimeHelper.getStartOfDay(startDate) } : {}),
        ...(endDate ? { lte: TimeHelper.getEndOfDay(endDate) } : {}),
      };
    }

    const [total, records] = await this.prismaService.$transaction([
      this.prismaService.kycRecord.count({ where: whereConditions }),
      this.prismaService.kycRecord.findMany({
        where: whereConditions,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              nickname: true,
              phone: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      list: records,
      page,
      pageSize,
    };
  }

  /**
   * Admin audit KYC record
   * @param kycId
   * @param dto
   * @param adminId
   * @param ip
   */
  async adminAudit(
    kycId: string,
    dto: AuditKycDto,
    adminId: string,
    ip: string,
  ) {
    return this.prismaService.$transaction(async (ctx) => {
      const admin = await ctx.adminUser.findUnique({
        where: { id: adminId },
      });

      if (!admin) {
        throw new BadRequestException('Admin user not found');
      }

      //check if record exists\
      const record = await ctx.kycRecord.findUnique({
        where: { id: kycId },
      });
      if (!record) {
        throw new BadRequestException('KYC record not found');
      }
      if (record.kycStatus !== KYC_STATUS.REVIEWING) {
        throw new BadRequestException('KYC record is not under review');
      }

      // update record status
      let nextStatus: KycStatus = record.kycStatus;
      let action: KycOpAction = OP_ACTION.SUBMIT;

      if (dto.action === OP_ACTION.APPROVE) {
        nextStatus = KYC_STATUS.APPROVED;
        action = OP_ACTION.APPROVE;
      } else if (dto.action === OP_ACTION.REJECT) {
        nextStatus = KYC_STATUS.REJECTED;
        action = OP_ACTION.REJECT;
      } else if (dto.action === OP_ACTION.NEED_MORE) {
        nextStatus = KYC_STATUS.NEED_MORE;
        action = OP_ACTION.NEED_MORE;
      }

      // update kyc record
      const updatedRecord = await ctx.kycRecord
        .update({
          where: { id: kycId, kycStatus: KYC_STATUS.REVIEWING },
          data: {
            kycStatus: nextStatus,
            auditorId: adminId,
            auditResult: dto.remark,
            auditedAt: new Date(),
            rejectReason: dto.action === OP_ACTION.REJECT ? dto.remark : null,
          },
        })
        .catch((error) => {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2025'
          ) {
            throw new BadRequestException(
              'KYC record not found or already updated',
            );
          }
          return error;
        });

      // update user's kyc status
      await ctx.user.update({
        where: { id: record.userId },
        data: {
          kycStatus: nextStatus,
        },
      });

      // log admin action
      await ctx.adminOperationLog.create({
        data: {
          adminId,
          adminName: admin.username,
          module: OpModule.USER,
          action: OpAction.USER.KYC_AUDIT,
          details: JSON.stringify({
            kycId,
            action,
            userId: record.userId,
            from: record.kycStatus,
            to: nextStatus,
            remark: dto.remark ?? null,
          }),
          requestIp: ip,
          createdAt: new Date(),
        },
      });

      return updatedRecord;
    });
  }

  /**
   * Get KYC record detail by ID
   * @param id
   */
  async detail(id: string) {
    const record = await this.prismaService.kycRecord.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            nickname: true,
            phone: true,
          },
        },
      },
    });

    if (!record) {
      throw new BadRequestException('KYC record not found');
    }
    return record;
  }
}
