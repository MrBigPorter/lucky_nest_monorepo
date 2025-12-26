import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { KycService } from '@api/client/kyc/kyc.service';
import { CurrentUserId } from '@api/common/decorators/user.decorator';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { SubmitKycDto } from '@api/client/kyc/dto/submit-kyc.dto';
import { KycIdTypesResponseDto } from '@api/client/kyc/dto/kyc-id-types.response.dto';
import { KycResponseDto } from '@api/client/kyc/dto/kyc.response.dto';
import { SessionResponseDto } from '@api/client/kyc/dto/session.response.dto';
import { Throttle } from '@nestjs/throttler';
import { RedisLockService } from '@api/common/redis/redis-lock.service';
import { DistributedLock } from '@api/common/decorators/distributed-lock.decorator';
import { DeviceSecurityGuard } from '@api/common/guards/device-security.guard';
import {
  DeviceSecurity,
  DeviceSecurityLevel,
} from '@api/common/decorators/device-security.decorator';
import {
  CurrentDevice,
  DeviceInfo,
} from '@api/common/decorators/http.decorators';
import { UploadService } from '@api/common/upload/upload.service';
import {
  UploadUrlDto,
  UploadUrlResponseDto,
} from '@api/client/kyc/dto/upload-url.dto';
import {
  KycIdCardOrcDto,
  KycOcrResponseDto,
} from '@api/client/kyc/dto/kyc-id-card-orc.dto';

@ApiTags('KYC')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, DeviceSecurityGuard)
@DeviceSecurity(DeviceSecurityLevel.LOG_ONLY)
@Controller('kyc')
export class KycController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly kycService: KycService,
    public readonly lockService: RedisLockService,
  ) {}

  /**
   * Create a liveness detection session for the user
   * @param userId
   */
  @Post('session')
  @HttpCode(HttpStatus.OK)
  @Throttle({ kycSessionRequest: { limit: 1, ttl: 60_000 } })
  @DistributedLock('kyc:session:create:{0}', 15000) // 每用户每 15 秒只能创建一次
  @ApiOkResponse({ type: SessionResponseDto })
  async createSession(@CurrentUserId() userId: string) {
    const session = await this.kycService.createSession(userId);
    return plainToInstance(SessionResponseDto, session);
  }

  /**
   * Get my KYC record
   * @param userId
   */
  @Get('me')
  @ApiOkResponse({ type: KycResponseDto })
  async me(@CurrentUserId() userId: string) {
    const record = await this.kycService.getMyKyc(userId);
    return plainToInstance(KycResponseDto, record);
  }

  /**
   * Get active ID types
   */
  @Get('id-types')
  @ApiProperty({ type: [KycIdTypesResponseDto] })
  async getIdTypes() {
    const idTypes = await this.kycService.getIdTypes();
    return plainToInstance(KycIdTypesResponseDto, idTypes);
  }

  /**
   * Submit KYC information
   * keyPattern: 'kyc:submit:{0}'
   * - {0} 表示第一个参数 (userId)
   * - 这样每个用户只能并发提交一次，互不影响
   */
  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: SubmitKycDto })
  @ApiOkResponse({ type: KycResponseDto })
  @DistributedLock('kyc:submit:{0}', 5000) // 每用户每 5 秒只能提交一次
  async submitKyc(
    @CurrentUserId() userId: string,
    @Body() dto: SubmitKycDto,
    @CurrentDevice() device: DeviceInfo,
  ) {
    const record = await this.kycService.submitKyc(userId, dto, device);
    return plainToInstance(KycResponseDto, record);
  }

  /**
   * Generate presigned upload URL for ID card upload
   * @param userId
   * @param dto
   */
  @Post('upload-url')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UploadUrlResponseDto })
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async uploadIdCard(
    @CurrentUserId() userId: string,
    @Body() dto: UploadUrlDto,
  ) {
    return this.uploadService.generatePresignedUrl(
      userId,
      dto.fileName,
      dto.fileType,
      'kyc',
    );
  }

  /**
   * OCR for ID card
   * @param dto
   * @param userId
   */
  @Post('ocr')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: KycOcrResponseDto })
  // 1. 节流：限制每分钟最多调 3 次 (防止脚本刷量)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @DistributedLock('kyc:ocr:id-card:{0}', 10000) // 每用户每 10 秒只能请求一次 OCR
  async ocrIdCard(
    @Body() dto: KycIdCardOrcDto,
    @CurrentUserId() userId: string,
  ) {
    const result = await this.kycService.ocrIdCard(userId, dto.key);
    if (!result) {
      throw new NotFoundException('OCR result not found');
    }
    return result;
  }
}
