import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsNumber,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePrizeDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '所属抽奖活动的ID' })
  activityId!: string;

  @IsInt()
  @Min(1)
  @Max(4)
  @Type(() => Number)
  @ApiProperty({
    description: '奖品类型 (1=优惠券, 2=金币, 3=余额, 4=谢谢参与)',
  })
  prizeType!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({ description: '奖品名称', maxLength: 100 })
  prizeName!: string;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  @Min(-1)
  @ApiPropertyOptional({ description: '库存（-1=不限）', default: -1 })
  stock?: number;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({ description: '排序（越小越靠前）', default: 0 })
  sortOrder?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @ApiProperty({ description: '中奖概率 (0-100)' })
  probability!: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: '关联的优惠券ID (当类型为优惠券时)',
  })
  couponId?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @ApiPropertyOptional({ description: '奖品数值 (金币/余额类型必填)' })
  prizeValue?: number;
}
