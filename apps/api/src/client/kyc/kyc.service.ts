import {
  BadRequestException,
  ConflictException,
  Injectable,
  Post,
} from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { SubmitKycDto } from '@api/client/kyc/dto/submit-kyc.dto';
import { KYC_STATUS, KycStatus } from '@lucky/shared';
import { UploadService } from '@api/common/upload/upload.service';
import { KycProviderService } from '@api/common/kyc-provider/kyc-provider.service';
import { CurrentUserId } from '@api/common/decorators/user.decorator';
import { ApiOkResponse } from '@nestjs/swagger';
import { SessionResponseDto } from '@api/client/kyc/dto/session.response.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/edge';

@Injectable()
export class KycService {
  constructor(
    private prismaService: PrismaService,
    private uploadService: UploadService,
    private kycProvider: KycProviderService,
  ) {}

  /**
   * Create a liveness detection session for the user
   * @param userId
   */
  async createSession(@CurrentUserId() userId: string) {
    return this.kycProvider.createLivenessSession(userId);
  }

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
   * Submit KYC information， including liveness verification and ID card matching
   * @param userId
   * @param dto
   */
  async submitKyc(userId: string, dto: SubmitKycDto) {
    // 1. 严格所有权检查 (新增：检查背面)
    // 这里的调用不仅是为了读取，更是为了利用 assertOwnedKey 防止越权
    // 校验文件是否存在且有权限访问
    await this.uploadService.getFileBuffer(dto.idCardFront, 'kyc', userId);

    if (dto.idCardBack) {
      await this.uploadService.getFileBuffer(dto.idCardBack, 'kyc', userId);
    }

    // check id type validity
    const idType = await this.prismaService.kycIdType.findFirst({
      where: { typeId: dto.idType, status: 1 },
    });

    if (!idType) {
      throw new BadRequestException('Invalid ID type');
    }

    return this.prismaService.$transaction(async (ctx) => {
      const sessionUsed = await ctx.kycRecord.findUnique({
        where: { sessionId: dto.sessionId },
      });

      if (sessionUsed) {
        throw new ConflictException('KYC session not found or already used.');
      }

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

      // 6. 调用 AWS 执行活体校验与人脸比对
      const {
        passed,
        reason,
        livenessConfidence,
        faceSimilarity,
        referenceImageBytes,
      } = await this.kycProvider.verifyLivenessAndMatchIdCard(
        userId,
        dto.sessionId,
        dto.idCardFront,
      );
      // 5. 决定初始状态
      let initialStatus: KycStatus = KYC_STATUS.REVIEWING;
      let autoRejectReason = null;
      // faceImageKey：优先用 AWS reference image 上传后的 key
      // 不信任前端传的 faceImage（防止用户传别人的 key）
      let faceImageKey: string | null = null;

      if (passed) {
        if (!referenceImageBytes) {
          initialStatus = KYC_STATUS.REJECTED;
          autoRejectReason = 'No reference image returned from KYC provider';
        } else {
          // AWS SDK v3 在浏览器/Node 环境下返回的是 Uint8Array
          const imageBuffer = Buffer.from(referenceImageBytes);
          const { key } = await this.uploadService.uploadBuffer(
            imageBuffer,
            'kyc',
            userId,
          );
          faceImageKey = key;
        }
      } else if (!passed) {
        initialStatus = KYC_STATUS.REJECTED;
        autoRejectReason = reason || 'Machine verification failed';
      }

      try {
        const record = await ctx.kycRecord.create({
          data: {
            userId,
            sessionId: dto.sessionId,
            kycStatus: initialStatus,
            idType: dto.idType,
            idNumber: dto.idNumber,
            realName: dto.realName,
            idCardFront: dto.idCardFront,
            idCardBack: dto.idCardBack,
            // 只用后端生成/验证过的 faceImageKey
            faceImage: faceImageKey,
            livenessScore: livenessConfidence ?? 0,
            videoUrl: dto.videoUrl,
            ocrRawData: dto.ocrRawData ?? {},
            verifyResult: {
              sessionId: dto.sessionId,
              passed,
              livenessConfidence,
              faceSimilarity,
              reason,
            },
            submittedAt: new Date(),
            auditResult: autoRejectReason ? 'Auto-rejected by System' : null,
            rejectReason: autoRejectReason,
            // 如果自动拒绝，视为已审核
            auditedAt:
              initialStatus === KYC_STATUS.REJECTED ? new Date() : null,
          },
        });

        // update user's kyc status to REVIEWING
        await ctx.user.update({
          where: { id: userId },
          data: {
            kycStatus: initialStatus,
          },
        });
        return record;
      } catch (error: any) {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          const target = error.meta?.target as string[];
          if (target && target.includes('sessionId')) {
            throw new ConflictException(
              'Liveness session already used (DB Constraint).',
            );
          }
          if (target && target.includes('idNumber')) {
            // 假设你给 idNumber 也加了 unique
            throw new ConflictException('Identity document already in use.');
          }
        }
        throw error;
      }
    });
  }
}
