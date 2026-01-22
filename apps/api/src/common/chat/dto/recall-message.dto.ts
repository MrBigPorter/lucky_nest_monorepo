import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecallMessageDto {
  @ApiProperty({ description: '要撤回的消息ID' })
  @IsString()
  @IsNotEmpty()
  messageId!: string;

  @ApiProperty({ description: '所属会话ID' })
  @IsString()
  @IsNotEmpty()
  conversationId!: string;
}
