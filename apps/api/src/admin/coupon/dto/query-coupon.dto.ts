import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ToInt, ToNumber } from '@api/common/dto/transforms';
import { Type } from 'class-transformer';

export class QueryCouponDto {
  @ApiProperty({
    description: 'Page number',
    example: 1,
  })
  @IsNotEmpty()
  @ToNumber()
  @IsInt()
  @Min(1)
  page!: number;

  @ApiProperty({
    description: 'Items per page',
    example: 10,
  })
  @IsNotEmpty()
  @ToNumber()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize!: number;

  @ApiPropertyOptional({
    description: 'Search keyword: coupon name / coupon code',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Status filter: 1 - Active; 2 - Inactive; ',
    example: 1,
  })
  @IsOptional()
  @ToInt()
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2])
  status?: number;

  @ApiPropertyOptional({
    description:
      'Coupon Type filter: 1-full reduction coupon; 2-discount coupon,3-no threshold coupon',
    example: 1,
  })
  @IsOptional()
  @ToInt()
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2, 3])
  couponType?: number;
}
