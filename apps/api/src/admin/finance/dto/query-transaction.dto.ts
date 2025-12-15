import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ToInt } from '@api/common/dto/transforms';

export class QueryTransactionDto {
  @ApiProperty({ description: 'page]', example: 1, required: false })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({ description: 'page size', example: 10, required: false })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;

  @ApiPropertyOptional({ description: 'User ID', example: 'user_12345' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Transaction Number',
    example: '202406120001',
  })
  @IsOptional()
  @IsString()
  transactionNo?: string;

  @ApiPropertyOptional({ description: 'Transaction Type', example: 1 })
  @IsOptional()
  @ToInt()
  @IsInt()
  type?: number;

  @ApiPropertyOptional({
    description: 'Start Date (ISO String)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End Date (ISO String)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
