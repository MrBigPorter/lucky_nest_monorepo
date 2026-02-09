import { ApiProperty } from '@nestjs/swagger';
import { ConversationType } from '@prisma/client';
import { DateToTimestamp } from '@api/common/dto/transforms';
import { ChatMemberRole } from '@lucky/shared';

// 1. 简单的 ID 返回 (用于创建接口)
export class ConversationIdResponseDto {
  @ApiProperty({ description: '会话ID' })
  conversationId!: string;
}

// 2. 完整的会话列表项 (用于列表页)
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

  @ApiProperty({ description: '未读数 (P0 核心字段)' })
  unreadCount!: number;

  @ApiProperty({ description: '最后一条消息 SeqId (用于同步断点)' })
  lastMsgSeqId!: number;

  constructor(partial: Partial<ConversationListResponseDto>) {
    Object.assign(this, partial);
  }
}

// 3. 成员简要信息 DTO (用于详情页成员列表)
export class ConversationMemberDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  nickname!: string;

  @ApiProperty()
  avatar!: string;

  @ApiProperty({ enum: ChatMemberRole })
  role!: ChatMemberRole;
}

// 4. 消息发送者信息
export class SenderInfoResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nickname!: string;

  @ApiProperty()
  avatar!: string;
}

// 5. 消息详情
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

export class ConversationDetailResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty({ enum: ConversationType })
  type!: ConversationType;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty()
  memberCount!: number;

  // --- P0 自愈核心字段 START ---
  @ApiProperty({ description: '会话最新的 SeqId' })
  lastMsgSeqId!: number;

  @ApiProperty({ description: '我已读到的 SeqId' })
  myLastReadSeqId!: number;

  @ApiProperty({ description: '未读数 (用于前端状态自愈判断)' })
  unreadCount!: number;
  // --- P0 自愈核心字段 END ---

  @ApiProperty()
  isPinned!: boolean;

  @ApiProperty()
  isMuted!: boolean;

  @ApiProperty({ type: [ConversationMemberDto] })
  members!: ConversationMemberDto[];
}
