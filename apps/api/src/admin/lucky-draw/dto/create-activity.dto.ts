import {
  IsInt,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateActivityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({ description: '活动标题', maxLength: 100 })
  title!: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: '关联宝物ID（不传代表全平台活动）' })
  treasureId?: string;

  @IsInt()
  @Type(() => Number)
  @Min(0)
  @Max(1)
  @IsOptional()
  @ApiPropertyOptional({ description: '状态：0=禁用，1=启用', default: 1 })
  status?: number;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({ description: '活动开始时间 (ISO 8601)' })
  startAt?: string;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({ description: '活动结束时间 (ISO 8601)' })
  endAt?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @ApiPropertyOptional({ description: '活动描述', maxLength: 500 })
  description?: string;
}
