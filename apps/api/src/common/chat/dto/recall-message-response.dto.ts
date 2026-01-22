import { ApiProperty } from '@nestjs/swagger';

export class RecallMessageResponseDto {
  @ApiProperty({ description: '被撤回的消息ID' })
  messageId!: string;

  @ApiProperty({ description: '撤回后的系统提示语' })
  tip!: string;
}
