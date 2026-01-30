import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { MessageMetaDto } from './message-meta.dto';

export class CreateMessageDto {
  @ApiProperty({ description: '客户端生成的 UUID' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ description: '会话 ID' })
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @ApiProperty({ description: '消息内容（文本或远程 URL）' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({
    description: '消息类型 (0:文本, 1:图片, 2:视频, 3:音频)',
    default: 0,
  })
  @IsInt()
  @IsOptional()
  type: number = 0;

  @ApiProperty({
    type: MessageMetaDto,
    description: '结构化媒体元数据',
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MessageMetaDto)
  @IsObject()
  meta?: MessageMetaDto;
}
