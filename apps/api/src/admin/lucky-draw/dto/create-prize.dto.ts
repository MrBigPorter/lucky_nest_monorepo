import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePrizeDto {
  /** 所属活动 */
  @IsString()
  activityId!: string;

  /** 1=优惠券 2=金币 3=余额 4=谢谢参与 */
  @IsInt()
  @Min(1)
  @Max(4)
  @Type(() => Number)
  prizeType!: number;

  @IsString()
  prizeName!: string;

  /** 关联优惠券模板（type=1 时必填）*/
  @IsOptional()
  @IsString()
  couponId?: string;

  /** 奖励数量/金额（type=2/3 时必填）*/
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  prizeValue?: number;

  /** 权重 0-100，同一活动所有奖品之和必须 = 100 */
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  probability!: number;

  /** 库存（-1 = 不限）*/
  @IsOptional()
  @IsInt()
  @Min(-1)
  @Type(() => Number)
  stock?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}
