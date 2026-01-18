import { ApiProperty } from '@nestjs/swagger';

export class MarkAsReadResponseDto {
  @ApiProperty({ description: '当前未读数 (成功后通常为0)', example: 0 })
  unreadCount!: number;

  @ApiProperty({ description: '更新后的已读水位线 (SeqId)', example: 105 })
  lastReadSeqId!: number;
}
