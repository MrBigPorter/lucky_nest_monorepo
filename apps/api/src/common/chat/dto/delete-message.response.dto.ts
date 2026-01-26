import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DeleteMessageResponseDto {
  @ApiProperty({ description: '删除的消息ID' })
  @Expose()
  messageId!: string;
}
