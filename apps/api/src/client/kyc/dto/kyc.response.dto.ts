import { Exclude, Expose, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Exclude()
export class KycResponseDto {
  @ApiProperty({ description: 'KYC Record ID' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'User ID' })
  @Expose()
  userId!: string;

  @ApiProperty({
    description:
      'KYC status: DRAFT: 0, REVIEWING: 1, REJECTED: 2, NEED_MORE: 3, APPROVED: 4, AUTO_REJECTED: 5',
    example: 1,
  })
  @Expose()
  kycStatus!: number;

  // === 1. 身份信息 ===

  @ApiProperty({ description: 'ID Type ID (e.g. 1, 10)', example: 1 })
  @Expose()
  idType!: number;

  @ApiPropertyOptional({ description: 'Real Name', example: 'Juan Dela Cruz' })
  @Expose()
  realName?: string;

  @ApiPropertyOptional({ description: 'ID Number', example: 'A123-4567-890' })
  @Expose()
  idNumber?: string;

  @ApiPropertyOptional({ description: 'Birthday', example: '1990-01-01' })
  @Expose()
  birthday?: Date;

  @ApiPropertyOptional({ description: 'Front Image S3 Key' })
  @Expose()
  idCardFront?: string;

  @ApiPropertyOptional({ description: 'Back Image S3 Key' })
  @Expose()
  idCardBack?: string;

  @ApiPropertyOptional({ description: 'Face/Selfie Image S3 Key' })
  @Expose()
  faceImage?: string;

  // === 3. 审核反馈 ===

  @ApiPropertyOptional({ description: 'Reason for rejection (Show to user)' })
  @Expose()
  rejectReason?: string;

  // === 4. 时间信息 ===

  @ApiPropertyOptional({ description: 'Submission timestamp' })
  @Expose()
  submittedAt?: Date;

  @ApiPropertyOptional({ description: 'Audit timestamp' })
  @Expose()
  auditedAt?: Date;

  // === 5. 高级调试信息 (可选) ===

  @ApiPropertyOptional({ description: 'OCR Raw Data (Optional display)' })
  @Expose()
  ocrRawData?: any;
}
