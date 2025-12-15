import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsIn, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ToInt } from '@api/common/dto/transforms';

export class TransactionQueryDto {
  @ApiProperty({ description: 'page', example: 1, type: Number })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  page!: number;

  @ApiProperty({ description: 'pageSize', example: 10, type: Number })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize!: number;

  @ApiPropertyOptional({
    description: 'Balance Type: 1 for Cash, 2 for Coin',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @ToInt()
  @IsInt()
  @IsIn([1, 2])
  balanceType?: number;

  @ApiPropertyOptional({
    description: 'Transaction Type Filter',
    example: 3,
    type: Number,
  })
  @IsOptional()
  @ToInt()
  @IsInt()
  transactionType?: number;
}
