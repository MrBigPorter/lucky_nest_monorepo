import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsNumber,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdatePrizeDto {
  @IsInt()
  @Min(1)
  @Max(4)
  @Type(() => Number)
  @IsOptional()
  @ApiPropertyOptional({
    description: '奖品类型 (1=优惠券, 2=金币, 3=余额, 4=谢谢参与)',
  })
  prizeType?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  @ApiPropertyOptional({ description: '奖品名称', maxLength: 100 })
  prizeName?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(-1)
  @ApiPropertyOptional({ description: '库存（-1=不限）' })
  stock?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @ApiPropertyOptional({ description: '排序（越小越靠前）' })
  sortOrder?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @ApiPropertyOptional({ description: '中奖概率 (0-100)' })
  probability?: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: '关联的优惠券ID (当类型为优惠券时)',
  })
  couponId?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({ description: '奖品数值 (金币/余额类型必填)' })
  prizeValue?: number;
}
