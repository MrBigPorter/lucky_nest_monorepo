import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsDateString,
  IsIn,
  IsInt,
  isNotEmpty,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ToDate, ToInt } from '@api/common/dto/transforms';
import { Transform, Type } from 'class-transformer';

export class SubmitKycDto {
  @ApiProperty({ description: 'AWS Liveness Session ID', maxLength: 100 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  sessionId!: string;

  @ApiProperty({ description: 'ID Type ID (e.g. 1, 10)', example: 1 })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  idType!: number;

  @ApiProperty({ description: 'ID Number', maxLength: 50 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  idNumber!: string;

  @ApiProperty({ description: 'Full Name', maxLength: 150 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  realName!: string;

  @ApiPropertyOptional({ description: 'First name', maxLength: 50 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  firstName!: string;

  @ApiPropertyOptional({ description: 'Middle name', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  middleName?: string;

  @ApiProperty({ description: 'Last name', maxLength: 50 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  lastName!: string;

  @ApiProperty({ description: 'Birthday (YYYY-MM-DD)', example: '1999-01-31' })
  @IsNotEmpty()
  @ToDate()
  @IsDate()
  birthday!: string;

  @ApiProperty({ description: 'Gender', example: 'MALE' })
  @IsNotEmpty()
  @IsString()
  @IsIn(['MALE', 'FEMALE', 'UNKNOWN'])
  gender?: string;

  @ApiProperty({ description: 'Country code (PH=63/CN=86/VN=84)', example: 63 })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  countryCode?: number;

  @ApiPropertyOptional({
    description: 'Expiry Date (YYYY-MM-DD)',
    example: '2030-12-31',
  })
  @IsOptional()
  @ToDate()
  @IsDate()
  expiryDate?: string;

  // ========= 地址（你页面里 province/city/barangay 是 wheel 选的 ID）=========
  @ApiProperty({ description: 'Province ID', example: 1 })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  provinceId!: number;

  @ApiProperty({ description: 'City ID', example: 10 })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  cityId!: number;

  @ApiProperty({ description: 'Barangay ID', example: 100 })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  barangayId!: number;

  @ApiProperty({ description: 'Address detail', maxLength: 500 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  address!: string;

  @ApiProperty({ description: 'Postal code', maxLength: 20 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  postalCode!: string;

  // ========= OCR 原始数据（你前端现在传 rawText 字符串不够，建议传对象）=========
  @ApiPropertyOptional({
    description: 'OCR raw data object (for audit/comparison)',
    example: {
      rawText: '...',
      provider: 'gemini',
      typeText: 'PH_DRIVER_LICENSE',
    },
  })
  @IsOptional()
  @IsObject()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  ocrRawData?: any;

  @ApiPropertyOptional({ description: 'Place of birth', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  placeOfBirth?: string;

  @ApiPropertyOptional({ description: 'Nationality', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nationality?: string;

  @ApiPropertyOptional({ description: 'Source of income', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceOfIncome?: string;

  @ApiPropertyOptional({ description: 'Nature of work', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  natureOfWork?: string;

  @ApiPropertyOptional({ description: 'Employer name', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  employerName?: string;
}
