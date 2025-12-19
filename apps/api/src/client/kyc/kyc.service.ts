import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { SubmitKycDto } from '@api/client/kyc/dto/submit-kyc.dto';
import { KYC_STATUS } from '@lucky/shared';

@Injectable()
export class KycService {
  constructor(private prismaService: PrismaService) {}

  /**
   * Get the latest KYC record for the current user
   * @param userId
   */
  async getMyKyc(userId: string) {
    return this.prismaService.kycRecord.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get active ID types
   */
  async getIdTypes() {
    return this.prismaService.kycIdType.findMany({
      where: { status: 1 },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Submit KYC information
   * @param userId
   * @param dto
   */
  async submitKyc(userId: string, dto: SubmitKycDto) {
    return this.prismaService.$transaction(async (ctx) => {
      // 全局检查：该证件号是否已被其他 APPROVED 的账号使用
      // 注意：是否允许 REVIEWING 状态重复取决于业务
      const duplicateId = await ctx.kycRecord.findFirst({
        where: {
          idNumber: dto.idNumber,
          userId,
          kycStatus: {
            in: [KYC_STATUS.REVIEWING, KYC_STATUS.APPROVED],
          },
        },
      });

      if (duplicateId) {
        throw new ConflictException('Identity document already in use.');
      }

      // 获取当前用户最新的 KYC 记录
      const existing = await ctx.kycRecord.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (existing?.kycStatus === KYC_STATUS.APPROVED) {
        throw new BadRequestException('KYC already approved, cannot resubmit');
      }
      if (existing?.kycStatus === KYC_STATUS.REVIEWING) {
        throw new BadRequestException('KYC is under review, cannot resubmit');
      }

      const record = await ctx.kycRecord.create({
        data: {
          userId,
          kycStatus: KYC_STATUS.REVIEWING,
          idType: dto.idType,
          idNumber: dto.idNumber,
          realName: dto.realName,
          idCardFront: dto.idCardFront,
          idCardBack: dto.idCardBack,
          faceImage: dto.faceImage,
          livenessScore: dto.livenessScore,
          videoUrl: dto.videoUrl,
          ocrRawData: dto.ocrRawData ?? {},
          verifyResult: dto.verifyResult ?? {},
          submittedAt: new Date(),
          auditResult: null,
          rejectReason: null,
          auditorId: null,
          auditedAt: null,
        },
      });

      // update user's kyc status to REVIEWING
      await ctx.user.update({
        where: { id: userId },
        data: {
          kycStatus: KYC_STATUS.REVIEWING,
        },
      });
      return record;
    });
  }
}
