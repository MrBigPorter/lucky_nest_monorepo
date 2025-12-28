import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Exclude()
export class KycResponseDto {
  @ApiProperty({
    description:
      'Status: 0-Draft, 1-Reviewing, 2-Rejected, 3-NeedMore, 4-Approved, 5-AutoReject',
  })
  @Expose()
  kycStatus!: number;

  // === 1. 证件核心信息 ===
  @ApiProperty({ description: 'ID Type (1-Passport, etc.)' })
  @Expose()
  idType!: number;

  @Expose() idNumber?: string;
  @Expose() firstName?: string;
  @Expose() middleName?: string;
  @Expose() lastName?: string;
  @Expose() realName?: string;
  @Expose() gender?: string;

  @ApiPropertyOptional({ type: Date })
  @Expose()
  @Type(() => Date)
  birthday?: Date;

  @Expose() placeOfBirth?: string;
  @Expose() nationality?: string;

  @ApiPropertyOptional({ type: Date })
  @Expose()
  @Type(() => Date)
  expiryDate?: Date;

  @ApiPropertyOptional({ type: Date })
  @Expose()
  @Type(() => Date)
  issueDate?: Date;

  @Expose() countryCode?: number;

  // === 2. 财务能力 (AMLA) ===
  @Expose() sourceOfIncome?: string;
  @Expose() natureOfWork?: string;
  @Expose() employerName?: string;

  // === 3. 地址信息 (Philippines Standard) ===
  @Expose() province?: string;
  @Expose() city?: string;
  @Expose() barangay?: string;
  @Expose() postalCode?: string;
  @Expose() address?: string;

  @Expose() isSameAddress!: boolean;
  @Expose() currentAddress?: any; // Json 字段直接吐给前端

  // === 4. 图片凭证 (S3 Keys) ===
  @Expose() idCardFront?: string;
  @Expose() idCardBack?: string;
  @Expose() selfiePhoto?: string;
  @Expose() assetProof?: string;
  @Expose() optionalPhoto?: string;
  @Expose() faceImage?: string;

  // === 5. 风控数据 ===
  @Expose() livenessScore?: number;
  @Expose() securityFlags?: any;
  @Expose() ocrRawData?: any;
  @Expose() riskLevel!: number;

  // === 6. 设备指纹 ===
  @Expose() ipAddress?: string;
  @Expose() deviceId?: string;
  @Expose() deviceModel?: string;
  @Expose() appVersion?: string;

  // === 7. 审核反馈 ===
  @Expose() auditResult?: string;
  @Expose() rejectReason?: string;
  @Expose() auditorId?: string;

  @Expose() @Type(() => Date) submittedAt?: Date;
  @Expose() @Type(() => Date) auditedAt?: Date;
  @Expose() @Type(() => Date) createdAt!: Date;
}
