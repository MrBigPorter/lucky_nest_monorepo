import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ToNumber } from '@api/common/dto/transforms';

export class QueryBannerDto {
  @ApiProperty({ description: 'page', example: 1, type: 'number' })
  @IsNotEmpty()
  @ToNumber()
  @IsInt()
  @Min(1)
  page!: number;

  @ApiProperty({ description: 'page size', example: 10, type: 'number' })
  @IsNotEmpty()
  @ToNumber()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize!: number;

  @ApiPropertyOptional({
    description: 'banner category, 1 home, 2 activity 3 product',
    example: 3,
    type: 'number',
  })
  @IsOptional()
  @IsInt()
  @ToNumber()
  bannerCate?: number;

  @ApiPropertyOptional({ description: 'title', example: 'Summer Sale' })
  @IsOptional()
  @IsString()
  title?: string;
}
