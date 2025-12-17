import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ToInt } from '@api/common/dto/transforms';

export class QueryRechargeOrdersDto {
  @ApiProperty({ description: 'Page Number', example: 1 })
  @IsNotEmpty()
  @ToInt()
  @IsNumber()
  page!: number;

  @ApiProperty({
    description: 'Recharge Order Number',
    example: 10,
  })
  @IsNotEmpty()
  @ToInt()
  @IsNumber()
  pageSize!: number;

  @ApiPropertyOptional({
    description: 'Recharge Order Number',
    example: 'recharge_12345',
    required: false,
  })
  @IsOptional()
  rechargeNo?: string;

  @ApiPropertyOptional({
    description: 'Order Status',
    example: 1,
    required: false,
  })
  @IsOptional()
  @ToInt()
  @IsNumber()
  status?: number;

  @ApiPropertyOptional({
    description: 'Search Keyword: order number / user nickname / phone number',
    example: 'john_doe',
    required: false,
  })
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Payment Channel: GCASH, PAYMAYA, BANK_TRANSFER, CARD',
    example: 'GCASH',
    required: false,
  })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional({
    description: 'Start Date (YYYY-MM-DD)',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End Date (YYYY-MM-DD)',
    example: '2024-01-31',
    required: false,
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}
