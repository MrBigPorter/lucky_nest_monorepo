import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  IsNumber,
  IsObject,
  IsNotEmpty,
  IsUrl,
} from 'class-validator';
import { ToInt, ToNumber } from '@api/common/dto/transforms';

export class SubmitKycDto {
  @ApiProperty({ description: '（KycIdType.typeId）', example: 1 })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  idType!: number;

  @ApiProperty({ description: 'id number', maxLength: 50 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  idNumber!: string;

  @ApiProperty({ description: 'real name', maxLength: 100 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  realName!: string;

  @ApiProperty({
    description: 'id card front image url',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  idCardFront!: string;

  @ApiPropertyOptional({
    description: 'id card back image url',
    maxLength: 255,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  idCardBack?: string;

  @ApiProperty({ description: 'face image url', maxLength: 255 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  faceImage!: string;

  @ApiPropertyOptional({ description: 'liveness score', example: 98.5 })
  @IsNotEmpty()
  @ToNumber()
  @IsNumber()
  livenessScore?: number;

  @ApiPropertyOptional({ description: 'video url', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'OCR raw data object' })
  @IsOptional()
  @IsObject()
  ocrRawData?: Record<string, any>;

  @ApiPropertyOptional({ description: 'verification result object' })
  @IsOptional()
  @IsObject()
  verifyResult?: Record<string, any>;
}
