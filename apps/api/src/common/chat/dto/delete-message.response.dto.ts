import { ApiProperty } from '@nestjs/swagger';

export class DeleteMessageResponseDto {
  @ApiProperty({ description: '删除的消息ID' })
  messageId!: string;
}
