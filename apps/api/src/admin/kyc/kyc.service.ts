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
import { UploadService } from '@api/common/upload/upload.service';
import {
  AdminCreateKycDto,
  AdminUpdateKycDto,
} from '@api/admin/kyc/dto/admin-create-kyc.dto';

@Injectable()
export class KycService {
  constructor(
    private prismaService: PrismaService,
    private uploadService: UploadService,
  ) {}

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
      idType,
    } = dto;

    const skip = (page - 1) * pageSize;
    const whereConditions: Prisma.KycRecordWhereInput = {};
    if (kycStatus != null || kycStatus !== undefined) {
      whereConditions.kycStatus = kycStatus;
    }
    if (userId) {
      whereConditions.userId = userId;
    }

    if (idType) {
      whereConditions.idType = idType;
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

    const list = await Promise.all(
      records.map((record) => this.transformRecord(record)),
    );

    return {
      total,
      list,
      page,
      pageSize,
    };
  }

  /**
   * Transform KYC record by generating signed URLs for images
   * @param record
   * @private
   */
  private async transformRecord(record: any) {
    if (!record) return null;

    //1. 并行生成签名 URL (纯内存计算，速度极快)
    // 注意：第三个参数必须传 record.userId，UploadService 需要验证文件归属
    const [idCardFrontUrl, idCardBackUrl, faceImage] = await Promise.all([
      record.idCardFront
        ? this.uploadService.getDownloadUrl(
            record.idCardFront,
            'kyc',
            record.userId,
          )
        : null,
      record.idCardBack
        ? this.uploadService.getDownloadUrl(
            record.idCardBack,
            'kyc',
            record.userId,
          )
        : null,
      record.faceImage
        ? this.uploadService.getDownloadUrl(
            record.faceImage,
            'kyc',
            record.userId,
          )
        : null,
    ]);
    return {
      ...record,
      idCardFront: idCardFrontUrl,
      idCardBack: idCardBackUrl,
      faceImage: faceImage,

      // 3. 清洗 OCR 数据里的敏感原始路径
      ocrRawData: this.sanitizeOcrData(record.ocrRawData),
    };
  }

  // 辅助：清洗 OCR 数据
  private sanitizeOcrData(ocr: any) {
    if (!ocr || typeof ocr !== 'object') return ocr;
    const clean = { ...ocr };
    // 删掉 OCR 结果里带的本地路径
    delete clean.idCardFront;
    delete clean.idCardBack;
    return clean;
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

  /**
   * Admin manually create KYC record (Directly Approved)
   * @param dto
   * @param adminId
   * @param ip
   */
  async createKycByAdmin(dto: AdminCreateKycDto, adminId: string, ip: string) {
    return this.prismaService.$transaction(async (ctx) => {
      // 1. Check Admin
      const admin = await ctx.adminUser.findUnique({
        where: { id: adminId },
      });
      if (!admin) {
        throw new BadRequestException('Admin user not found');
      }

      // 2. Check User
      const user = await ctx.user.findUnique({
        where: { id: dto.userId },
      });
      if (!user) {
        throw new BadRequestException('Target user not found');
      }

      // 3. Check if already verified (Optional safety check)
      if (user.kycStatus === KYC_STATUS.APPROVED) {
        throw new BadRequestException('User is already KYC verified');
      }

      // 4. Create KYC Record (Status = APPROVED)
      const newRecord = await ctx.kycRecord.create({
        data: {
          userId: dto.userId,
          realName: dto.realName,
          idNumber: dto.idNumber,
          idType: dto.idType || 1, // Default ID Card

          // Handle images: Admin might not upload images for manual entry
          // Use a placeholder or empty string if allowed by DB
          idCardFront: dto.idCardFront || '',
          idCardBack: dto.idCardBack || '',
          faceImage: dto.faceImage || '',

          // Directly Approve
          kycStatus: KYC_STATUS.APPROVED,

          // Audit Info
          auditorId: adminId,
          auditResult: dto.remark || 'Manually created by Admin',
          auditedAt: new Date(),
        },
      });

      // 5. Update User Status
      await ctx.user.update({
        where: { id: dto.userId },
        data: {
          kycStatus: KYC_STATUS.APPROVED,
        },
      });

      // 6. Log Operation
      await ctx.adminOperationLog.create({
        data: {
          adminId,
          adminName: admin.username,
          module: OpModule.USER,
          action: OpAction.USER.KYC_AUDIT, // Or define a specific KYC_CREATE action
          details: JSON.stringify({
            userId: dto.userId,
            action: 'MANUAL_CREATE',
            kycRecordId: newRecord.id,
            remark: dto.remark,
          }),
          requestIp: ip,
          createdAt: new Date(),
        },
      });

      return newRecord;
    });
  }
  /**
   * Admin update KYC info
   * @param userId
   * @param dto
   * @param adminId
   * @param ip
   */
  async updateKycInfo(
    userId: string,
    dto: AdminUpdateKycDto,
    adminId: string,
    ip: string,
  ) {
    return this.prismaService.$transaction(async (ctx) => {
      //check if record exists\
      const record = await ctx.kycRecord.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (!record) {
        throw new BadRequestException('KYC record not found');
      }
      const admin = await ctx.adminUser.findUnique({
        where: { id: adminId },
      });
      if (!admin) {
        throw new BadRequestException('Admin user not found');
      }
      // update kyc record
      const updatedRecord = await ctx.kycRecord.update({
        where: { id: record.id },
        data: {
          ...dto,
          auditedAt: new Date(),
          auditorId: adminId,
          auditResult: dto.remark || `Info updated by admin: ${admin.username}`,
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
            kycId: record.id,
            userId: record.userId,
            updates: dto,
          }),
          requestIp: ip,
          createdAt: new Date(),
        },
      });

      return updatedRecord;
    });
  }

  /**
   * Admin revoke KYC approval
   * @param userId
   * @param reason
   * @param adminId
   * @param ip
   */
  async revokeKyc(userId: string, reason: string, adminId: string, ip: string) {
    return this.prismaService.$transaction(async (ctx) => {
      //check if record exists\
      const record = await ctx.kycRecord.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (!record) {
        throw new BadRequestException('KYC record not found');
      }
      // update kyc record
      const updatedRecord = await ctx.kycRecord.update({
        where: { id: record.id },
        data: {
          kycStatus: KYC_STATUS.REJECTED,
          auditedAt: new Date(),
          auditorId: adminId,
          auditResult: reason,
          rejectReason: reason,
        },
      });

      // update user's kyc status
      await ctx.user.update({
        where: { id: record.userId },
        data: {
          kycStatus: KYC_STATUS.REJECTED,
        },
      });

      // log admin action
      const admin = await ctx.adminUser.findUnique({
        where: { id: adminId },
      });
      if (!admin) {
        throw new BadRequestException('Admin user not found');
      }
      await ctx.adminOperationLog.create({
        data: {
          adminId,
          adminName: admin.username,
          module: OpModule.USER,
          action: OpAction.USER.KYC_AUDIT,
          details: JSON.stringify({
            kycId: record.id,
            action: OP_ACTION.REJECT,
            userId: record.userId,
            from: record.kycStatus,
            to: KYC_STATUS.REJECTED,
            remark: reason,
          }),
          requestIp: ip,
          createdAt: new Date(),
        },
      });

      return updatedRecord;
    });
  }

  /**
   * Admin delete KYC record
   * @param userId
   * @param adminId
   * @param ip
   */
  async deleteKyc(userId: string, adminId: string, ip: string) {
    return this.prismaService.$transaction(async (ctx) => {
      //check if record exists\
      const record = await ctx.kycRecord.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (!record) {
        throw new BadRequestException('KYC record not found');
      }

      // delete kyc record
      await ctx.kycRecord.delete({
        where: { id: record.id },
      });

      // update user's kyc status
      await ctx.user.update({
        where: { id: record.userId },
        data: {
          kycStatus: KYC_STATUS.DRAFT,
        },
      });

      // log admin action
      const admin = await ctx.adminUser.findUnique({
        where: { id: adminId },
      });
      if (!admin) {
        throw new BadRequestException('Admin user not found');
      }
      await ctx.adminOperationLog.create({
        data: {
          adminId,
          adminName: admin.username,
          module: OpModule.USER,
          action: OpAction.USER.KYC_AUDIT,
          details: JSON.stringify({
            kycId: record.id,
            action: 'DELETE',
            userId: record.userId,
          }),
          requestIp: ip,
          createdAt: new Date(),
        },
      });
    });
  }
}
