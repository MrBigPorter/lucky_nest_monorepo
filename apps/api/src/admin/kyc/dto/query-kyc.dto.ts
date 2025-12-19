import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  isDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ToInt } from '@api/common/dto/transforms';

export class QueryKycDto {
  @ApiPropertyOptional({ description: 'page number', example: 1 })
  @IsOptional()
  @ToInt()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'items per page', example: 10 })
  @IsOptional()
  @ToInt()
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: 'user ID', example: 'user_12345' })
  @IsOptional()
  @IsString()
  userId?: string;
  @ApiPropertyOptional({
    description:
      'KYC status:  DRAFT: 0,  未提交 REVIEWING: 1,  审核中 REJECTED: 2,  审核失败 NEED_MORE: 3,  待补充 APPROVED: 4,  已通过 ',
    example: 1,
  })
  @IsOptional()
  @ToInt()
  @IsInt()
  kycStatus?: number;

  @ApiPropertyOptional({
    description: 'start date (ISO format)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'end date (ISO format)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
