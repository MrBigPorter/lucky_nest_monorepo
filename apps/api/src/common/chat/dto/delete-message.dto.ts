import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteMessageDto {
  @ApiProperty({ description: '要删除的消息ID' })
  @IsString()
  @IsNotEmpty()
  messageId!: string;

  @ApiProperty({ description: '所属会话ID' })
  @IsString()
  @IsNotEmpty()
  conversationId!: string;
}
