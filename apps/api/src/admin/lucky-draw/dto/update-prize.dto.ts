import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePrizeDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  @Type(() => Number)
  prizeType?: number;

  @IsOptional()
  @IsString()
  prizeName?: string;

  @IsOptional()
  @IsString()
  couponId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  prizeValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  probability?: number;

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
