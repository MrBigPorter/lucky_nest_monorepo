import { ApiProperty } from '@nestjs/swagger';
import { ConversationType } from '@prisma/client';
import { DateToTimestamp } from '@api/common/dto/transforms';

// 1. 简单的 ID 返回 (用于创建接口)
export class ConversationIdResponseDto {
  @ApiProperty({ description: '会话ID' })
  conversationId!: string;
}

// 2. 完整的会话列表项
export class ConversationListResponseDto {
  @ApiProperty({ description: '会话ID' })
  id!: string;

  @ApiProperty({ enum: ConversationType, description: '会话类型' })
  type!: ConversationType;

  @ApiProperty({ description: '显示名称 (群名或对方昵称)' })
  name!: string;

  @ApiProperty({ description: '显示头像', required: false })
  avatar?: string | null;

  @ApiProperty({ description: '最后一条消息内容', required: false })
  lastMsgContent?: string | null;

  @ApiProperty({ description: '最后一条消息时间 (毫秒时间戳)' })
  lastMsgTime!: number;

  @ApiProperty({ description: '是否置顶' })
  isPinned!: boolean;

  @ApiProperty({ description: '是否免打扰' })
  isMuted!: boolean;

  @ApiProperty({ description: '未读数 (仅供参考，准确值建议前端计算)' })
  unreadCount!: number;

  // 构造函数：负责把 Prisma 的复杂数据 "洗" 成 DTO
  constructor(partial: Partial<ConversationListResponseDto>) {
    Object.assign(this, partial);
  }
}

// 3. 消息发送者信息 (用于详情页)
export class SenderInfoResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nickname!: string;

  @ApiProperty()
  avatar!: string;
}

// 4. 消息详情 (用于详情页历史记录)
export class ChatMessageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  type!: number;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  @DateToTimestamp()
  createdAt!: number;

  @ApiProperty({ type: SenderInfoResponseDto, required: false })
  sender?: SenderInfoResponseDto;
}

// 5. 会话详情 (包含历史记录)
export class ConversationDetailResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: [ChatMessageResponseDto] })
  history!: ChatMessageResponseDto[];
}
