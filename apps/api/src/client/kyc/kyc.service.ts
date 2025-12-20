import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { SubmitKycDto } from '@api/client/kyc/dto/submit-kyc.dto';
import { KYC_STATUS, KycStatus } from '@lucky/shared';
import { UploadService } from '@api/common/upload/upload.service';
import { KycProviderService } from '@api/common/kyc-provider/kyc-provider.service';

@Injectable()
export class KycService {
  constructor(
    private prismaService: PrismaService,
    private uploadService: UploadService,
    private kycProvider: KycProviderService,
  ) {}

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
    const idType = await this.prismaService.kycIdType.findUnique({
      where: { typeId: dto.idType, status: 1 },
    });

    if (!idType) {
      throw new BadRequestException('Invalid ID type');
    }

    // 将私有 Key 转换为临时 URL 给第三方验证
    // Face++ 需要能下载图片的 URL，私有 Key 它是读不了的
    const [frontUrl, faceUrl] = await Promise.all([
      this.uploadService.getDownloadUrl(dto.idCardFront, 'kyc'),
      this.uploadService.getDownloadUrl(dto.faceImage, 'kyc'),
    ]);

    // 构造一个临时的 verify 对象
    // 注意：如果有 videoUrl 且需要验证活体视频，也要转换 videoUrl
    const verifyDto = {
      ...dto,
      idCardFront: frontUrl || dto.idCardFront, // 如果转换失败回退到 key (虽然会验证失败)
      faceImage: faceUrl || dto.faceImage,
    };

    // 4. 调用第三方验证 (使用临时 URL)
    const verifyResult = await this.kycProvider.verify(verifyDto);
    // 5. 决定初始状态
    let initialStatus: KycStatus = KYC_STATUS.REVIEWING;
    let autoRejectReason = null;

    if (!verifyResult.passed) {
      initialStatus = KYC_STATUS.REJECTED;
      autoRejectReason =
        verifyResult.rejectReason || 'Machine verification failed';
    }

    return this.prismaService.$transaction(async (ctx) => {
      // 全局检查：该证件号是否已被其他 APPROVED 的账号使用
      // 注意：是否允许 REVIEWING 状态重复取决于业务
      const duplicateId = await ctx.kycRecord.findFirst({
        where: {
          idNumber: dto.idNumber,
          userId: { not: userId },
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
          kycStatus: initialStatus,
          idType: dto.idType,
          idNumber: dto.idNumber,
          realName: dto.realName,
          idCardFront: dto.idCardFront,
          idCardBack: dto.idCardBack,
          faceImage: dto.faceImage,
          livenessScore: verifyResult.score ?? 0,
          videoUrl: dto.videoUrl,
          ocrRawData: dto.ocrRawData ?? {},
          verifyResult: dto.verifyResult ?? {},
          submittedAt: new Date(),
          auditResult: autoRejectReason ? 'Auto-rejected by System' : null,
          rejectReason: autoRejectReason,
          // 如果自动拒绝，视为已审核
          auditedAt: initialStatus === KYC_STATUS.REJECTED ? new Date() : null,
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
