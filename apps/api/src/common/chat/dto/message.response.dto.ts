import { ApiProperty } from '@nestjs/swagger';
import { DateToTimestamp } from '@api/common/dto/transforms';

export class MessageSenderDto {
  @ApiProperty({ description: '发送者ID' })
  id!: string;

  @ApiProperty({ description: '昵称' })
  nickname!: string;

  @ApiProperty({ description: '头像', required: false })
  avatar?: string;
}

export class MessageResponseDto {
  @ApiProperty({ description: '消息ID' })
  id!: string;

  @ApiProperty({ description: '消息序列号 (用于标记已读)' })
  seqId!: number;

  @ApiProperty({ description: '消息内容' })
  content!: string;

  @ApiProperty({ description: '消息类型 (0: text, 1: image)', example: 0 })
  type!: number;

  @ApiProperty({ description: '发送时间 (时间戳)', example: 1700000000000 })
  @DateToTimestamp()
  createdAt!: number;

  @ApiProperty({ description: '是否是我发的 (用于前端区分左右)' })
  isSelf!: boolean;

  @ApiProperty({ description: '发送者信息' })
  sender!: MessageSenderDto;
}

export class MessageListResponseDto {
  @ApiProperty({
    description: '消息列表',
    type: [MessageResponseDto],
  })
  list!: MessageResponseDto[];

  @ApiProperty({
    description: '下一页游标 (如果为 null 表示没有更多了)',
    required: false,
    nullable: true,
    type: String,
    example: 'msg_cl5s8x...',
  })
  nextCursor!: string | null;
}
