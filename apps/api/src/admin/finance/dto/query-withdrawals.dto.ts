import { ApiProperty } from '@nestjs/swagger';
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

export class QueryWithdrawalsDto {
  @ApiProperty({ description: 'Page number', example: 1 })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  page!: number;

  @ApiProperty({ description: 'Page size', example: 10 })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(10)
  @Max(100)
  pageSize!: number;

  @ApiProperty({
    description: 'Status (optional)',
    example: 4,
    required: false,
  })
  @IsOptional()
  @ToInt()
  @IsInt()
  status?: number;

  @ApiProperty({
    description: 'Start Date (ISO String, optional)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End Date (ISO String, optional)',
    example: '2024-01-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description:
      'Keyword for searching (user ID, nickname, or phone, order number, optional)',
    example: 'john_doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;
}
