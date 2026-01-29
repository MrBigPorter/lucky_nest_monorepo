import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsInt()
  @IsOptional()
  type: number = 0;

  @ApiProperty({ description: 'Extensible metadata object', required: false })
  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;

  // 保留旧字段用于兼容，但标记为可选
  @IsInt()
  @IsOptional()
  duration?: number;

  @IsNumber()
  @IsOptional()
  width?: number;

  @IsNumber()
  @IsOptional()
  height?: number;
}
