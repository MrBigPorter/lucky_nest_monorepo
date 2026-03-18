import {
  IsInt,
  IsString,
  IsOptional,
  IsDateString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateActivityDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  @ApiPropertyOptional({ description: '活动标题', maxLength: 100 })
  title?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: '关联宝物ID（传 null 清空）' })
  treasureId?: string | null;

  @IsInt()
  @Type(() => Number)
  @Min(0)
  @Max(1)
  @IsOptional()
  @ApiPropertyOptional({ description: '状态：0=禁用，1=启用' })
  status?: number;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({ description: '活动开始时间 (ISO 8601)' })
  startAt?: string | null;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({ description: '活动结束时间 (ISO 8601)' })
  endAt?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @ApiPropertyOptional({ description: '活动描述', maxLength: 500 })
  description?: string;
}
