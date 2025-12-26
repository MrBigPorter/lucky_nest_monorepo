import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { SubmitKycDto } from '@api/client/kyc/dto/submit-kyc.dto';
import { KYC_STATUS, KycStatus, TimeHelper } from '@lucky/shared';
import { UploadService } from '@api/common/upload/upload.service';
import { KycProviderService } from '@api/common/kyc-provider/kyc-provider.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/edge';
import { DeviceInfo } from '@api/common/decorators/http.decorators';
import dayjs from 'dayjs';

// 限制图片大小策略 (Fail Fast)
const MIN_IMAGE_SIZE = 5 * 1024; // 5KB (小于这个通常是损坏文件或纯色块)
const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB (太大浪费带宽和内存)

@Injectable()
export class KycService {
  constructor(
    private prismaService: PrismaService,
    private uploadService: UploadService,
    private kycProvider: KycProviderService,
  ) {}

  /**
   * Validate image size
   * @param buffer
   * @param fieldName
   */
  async validateImageSize(buffer: Buffer, fieldName: string) {
    const size = buffer.length;
    if (size < MIN_IMAGE_SIZE) {
      throw new BadRequestException(
        `Uploaded file for ${fieldName} is too small to be a valid image.`,
      );
    }
    if (size > MAX_IMAGE_SIZE) {
      throw new BadRequestException(
        `Uploaded file for ${fieldName} exceeds the maximum allowed size of ${MAX_IMAGE_SIZE / (1024 * 1024)} MB.`,
      );
    }
  }

  /**
   * Create a liveness detection session for the user
   * @param userId
   */
  async createSession(userId: string) {
    const DAILY_LIMIT = 2; // 每用户每天最多创建 2 次
    const REUSE_WINDOW_MINUTES = 10; // 10 分钟内复用已有 session
    const startOfDay = TimeHelper.getStartOfDay();

    // 多天冷却策略
    const REJECT_COOLDOWN_HOURS = 72; // 3天
    const PENALTY_WINDOW_DAYS = 30;
    const PENALTY_REJECT_COUNT = 2;
    const PENALTY_COOLDOWN_DAYS = 7;

    // 0) 如果正在审核，直接禁止
    const latestKyc = await this.prismaService.kycRecord.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { kycStatus: true, createdAt: true, auditedAt: true },
    });

    if (latestKyc?.kycStatus === KYC_STATUS.REVIEWING) {
      throw new BadRequestException(
        'KYC is under review, cannot create session',
      );
    }

    if (latestKyc?.kycStatus === KYC_STATUS.APPROVED) {
      throw new BadRequestException(
        'KYC already approved, cannot create session',
      );
    }

    // 1) 30天内被拒次数 -> 惩罚冷却
    const rejectCount = await this.prismaService.kycRecord.count({
      where: {
        userId,
        kycStatus: KYC_STATUS.REJECTED,
        createdAt: {
          gte: TimeHelper.getTimeAgo(PENALTY_WINDOW_DAYS, 'day'),
        },
      },
    });

    // 2) 如果最新一次是 REJECTED，检查冷却（优先用 auditedAt，没有就用 createdAt）
    if (latestKyc?.kycStatus === KYC_STATUS.REJECTED) {
      const base = latestKyc.auditedAt ?? latestKyc.createdAt;

      // 惩罚冷却（更长）
      if (rejectCount >= PENALTY_REJECT_COUNT) {
        const until = dayjs(base).add(PENALTY_COOLDOWN_DAYS, 'day').toDate();
        if (until > new Date()) {
          throw new BadRequestException(
            `Due to multiple recent KYC rejections, you can create a new session after ${dayjs(
              until,
            ).format('YYYY-MM-DD HH:mm:ss')}`,
          );
        }
      } else {
        // 普通冷却
        const until = dayjs(base).add(REJECT_COOLDOWN_HOURS, 'hour').toDate();
        if (until > new Date()) {
          throw new BadRequestException(
            `You can create a new KYC session after ${dayjs(until).format(
              'YYYY-MM-DD HH:mm:ss',
            )}`,
          );
        }
      }
    }

    // 1. 检查当天创建次数
    const todayCount = await this.prismaService.kycLivenessSession.count({
      where: {
        userId,
        createdAt: { gte: startOfDay },
      },
    });
    if (todayCount >= DAILY_LIMIT) {
      throw new BadRequestException(
        `Daily KYC session limit reached (${DAILY_LIMIT}/day)`,
      );
    }

    // 2. 检查最近是否有未使用的 session 可复用
    const reusableSession =
      await this.prismaService.kycLivenessSession.findFirst({
        where: {
          userId,
          usedAt: null,
          createdAt: {
            gte: TimeHelper.getTimeAgo(REUSE_WINDOW_MINUTES, 'minute'),
          },
        },
        orderBy: { createdAt: 'desc' },
      });

    if (reusableSession) {
      return {
        sessionId: reusableSession.sessionId,
        reused: true,
        todayUsedCount: todayCount, // 没有新增创建次数
        dailyLimit: DAILY_LIMIT,
        remaining: DAILY_LIMIT - todayCount,
      };
    }

    // 3. 创建新 session
    const session = await this.kycProvider.createLivenessSession(userId);

    if (!session || !session.sessionId) {
      throw new BadRequestException('Could not create KYC liveness session');
    }

    // 4. 记录到数据库
    await this.prismaService.kycLivenessSession.create({
      data: {
        userId,
        sessionId: session.sessionId,
      },
    });

    const newCount = todayCount + 1;

    return {
      sessionId: session.sessionId,
      reused: false,
      todayUsedCount: newCount,
      dailyLimit: DAILY_LIMIT,
      remaining: DAILY_LIMIT - newCount,
    };
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
   * Perform OCR on the provided ID card image
   * @param userId
   * @param idCardKey
   */
  async ocrIdCard(userId: string, idCardKey: string) {
    // 校验文件是否存在且有权限访问
    const imageBuffer = await this.uploadService.getFileBuffer(
      idCardKey,
      'kyc',
      userId,
    );

    // 验证图片大小
    await this.validateImageSize(imageBuffer, 'ID Card');

    // 调用 KYC Provider 进行 OCR
    // 3. 只有检查通过了，才去调用昂贵的 OCR 服务
    // 注意：如果 UploadService 实现了缓存，这里不会重复下载
    // 如果 KycProvider 支持传入 Buffer，建议修改 KycProvider 接口直接传 imageBuffer，避免二次下载
    return await this.kycProvider.ocrIdCard(userId, idCardKey);
  }

  /**
   * Submit KYC information， including liveness verification and ID card matching
   * @param userId
   * @param dto
   * @param device
   */
  async submitKyc(userId: string, dto: SubmitKycDto, device: DeviceInfo) {
    // 1. 严格所有权检查 (检查背面)
    // 这里的调用不仅是为了读取，更是为了利用 assertOwnedKey 防止越权
    // 校验文件是否存在且有权限访问
    const frontBuffer = await this.uploadService.getFileBuffer(
      dto.idCardFront,
      'kyc',
      userId,
    );

    // 验证图片大小
    await this.validateImageSize(frontBuffer, 'ID Card Front');

    if (dto.idCardBack) {
      const backBuffer = await this.uploadService.getFileBuffer(
        dto.idCardBack,
        'kyc',
        userId,
      );
      await this.validateImageSize(backBuffer, 'ID Card Back');
    }

    // check id type validity
    const idType = await this.prismaService.kycIdType.findFirst({
      where: { typeId: dto.idType, status: 1 },
    });

    if (!idType) {
      throw new BadRequestException('Invalid ID type');
    }

    return this.prismaService.$transaction(async (ctx) => {
      const session = await ctx.kycLivenessSession.findUnique({
        where: { sessionId: dto.sessionId },
      });

      if (!session || !session.sessionId) {
        throw new ConflictException('KYC session not found.');
      }

      if (session.usedAt) {
        throw new ConflictException('KYC session not found or already used.');
      }

      const claim = await ctx.kycLivenessSession.updateMany({
        where: {
          sessionId: dto.sessionId,
          userId,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });

      if (claim.count !== 1) {
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
            ipAddress: device.ip,
            deviceId: device.deviceId,
            deviceModel: device.deviceModel,
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
