import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { DateToTimestamp } from '@api/common/dto/transforms';

@Exclude()
export class KycRecordResponseDto {
  @ApiProperty({ description: 'KYC record ID' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'User ID' })
  @Expose()
  userId!: string;

  @ApiProperty({
    description:
      'DRAFT: 0,  未提交REVIEWING: 1,  审核中 REJECTED: 2,  审核失败 NEED_MORE: 3,  待补充 APPROVED: 4,  已通过',
  })
  @Expose()
  kycStatus!: number;

  @ApiProperty({ description: 'ID Type' })
  @Expose()
  idType!: number;

  @ApiPropertyOptional({ required: false })
  @Expose()
  idNumber?: string;

  @ApiPropertyOptional({ required: false })
  @Expose()
  realName?: string;

  @ApiPropertyOptional({ required: false })
  @Expose()
  idCardFront?: string;

  @ApiPropertyOptional({ required: false })
  @Expose()
  idCardBack?: string;

  @ApiPropertyOptional({ required: false })
  @Expose()
  faceImage?: string;

  @ApiPropertyOptional({ required: false })
  @Expose()
  livenessScore?: number;

  @ApiPropertyOptional({ required: false })
  @Expose()
  videoUrl?: string;

  @ApiPropertyOptional({ required: false })
  @Expose()
  ocrRawData?: any;

  @ApiPropertyOptional({ required: false })
  @Expose()
  verifyResult?: any;

  @ApiPropertyOptional({ required: false })
  @Expose()
  auditResult?: string;

  @ApiPropertyOptional({ required: false })
  @Expose()
  rejectReason?: string;

  @ApiPropertyOptional({ required: false })
  @Expose()
  auditorId?: string;

  @ApiPropertyOptional({ required: false })
  @Expose()
  submittedAt?: Date;

  @ApiPropertyOptional({ required: false })
  @Expose()
  @DateToTimestamp()
  auditedAt?: number;

  @ApiPropertyOptional({ required: false })
  @Expose()
  @DateToTimestamp()
  createdAt!: number;

  @ApiProperty({ type: Number })
  @Expose()
  @DateToTimestamp()
  updatedAt!: number;

  @ApiProperty({ required: false, type: Object })
  @Expose()
  user?: { nickname?: string; phone?: string };
}
