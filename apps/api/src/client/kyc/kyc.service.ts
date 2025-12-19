import { BadRequestException, Injectable } from '@nestjs/common';
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
      // check if there is an existing KYC record in REVIEWING or APPROVED status
      const existing = await this.prismaService.kycRecord.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      if (existing?.kycStatus === KYC_STATUS.APPROVED) {
        throw new BadRequestException('KYC already approved, cannot resubmit');
      }
      if (existing?.kycStatus === KYC_STATUS.REVIEWING) {
        throw new BadRequestException('KYC is under review, cannot resubmit');
      }

      return ctx.kycRecord.create({
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
          ocrRawData: dto.ocrRawData as any,
          verifyResult: dto.verifyResult as any,
          submittedAt: new Date(),
          auditResult: null,
          rejectReason: null,
          auditorId: null,
          auditedAt: null,
        },
      });
    });
  }
}
