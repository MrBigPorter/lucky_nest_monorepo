import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ description: '会话ID' })
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @ApiProperty({ description: '消息内容' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({ description: '消息类型 (0:文本, 1:图片)', default: 0 })
  @IsInt()
  @IsOptional()
  type: number = 0;
}
