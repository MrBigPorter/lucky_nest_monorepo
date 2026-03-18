import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateActivityDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  /** 绑定商品 ID（null = 全平台任意订单触发）*/
  @IsOptional()
  @IsString()
  treasureId?: string;

  /** 0=禁用 1=启用，默认 1 */
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  status?: number;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;
}
