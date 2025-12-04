import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ToNumber } from '@api/common/dto/transforms';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ListOrdersDto {
  @ApiPropertyOptional({
    description: 'status',
    example: 'all',
    enum: ['all', 'paid', 'unpaid', 'refunded', 'cancelled'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['all', 'paid', 'unpaid', 'refunded', 'cancelled'])
  status?: 'all' | 'paid' | 'unpaid' | 'refunded' | 'cancelled' = 'all';

  @ApiPropertyOptional({ description: 'page', example: 1, type: Number })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'pageSize', example: 50, type: Number })
  @IsOptional()
  @ToNumber()
  @Min(1)
  @IsInt()
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({
    description: 'treasureId',
    example: 'uuid-v4',
    type: String,
  })
  @IsOptional()
  @IsString()
  treasureId?: string;
}
