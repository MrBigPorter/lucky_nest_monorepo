// ==========================================
//  事件常量定义 (Event Constants)
// ==========================================
export const CHAT_GROUP_EVENTS = {
  MEMBER_KICKED: 'chat.group.member_kicked',
  MEMBER_MUTED: 'chat.group.member_muted',
  OWNER_TRANSFERRED: 'chat.group.owner_transferred',
  MEMBER_ROLE_UPDATED: 'chat.group.member_role_updated',
  INFO_UPDATED: 'chat.group.info_updated',
  MEMBER_JOINED: 'chat.group.member_joined',
  MEMBER_LEFT: 'chat.group.member_left',
  GROUP_DISBANDED: 'chat.group.disbanded',
};

// ==========================================
//  Payload 类定义 (已统一 targetId 和 syncType)
// ==========================================

export class GroupMemberKickedEvent {
  constructor(
    public readonly conversationId: string,
    public readonly operatorId: string,
    public readonly targetId: string, // 统一字段名
    public readonly timestamp: number,
    public readonly syncType: string = 'REMOVE', // 默认指令：删除本地会话
  ) {}
}

export class GroupMemberMutedEvent {
  constructor(
    public readonly conversationId: string,
    public readonly operatorId: string,
    public readonly targetId: string, // 统一字段名
    public readonly mutedUntil: number | null,
    public readonly syncType: string = 'PATCH', // 默认指令：局部修补 UI
  ) {}
}

export class GroupOwnerTransferredEvent {
  constructor(
    public readonly conversationId: string,
    public readonly operatorId: string,
    public readonly targetId: string, // 统一字段名 (新群主)
    public readonly syncType: string = 'PATCH',
  ) {}
}

export class GroupInfoUpdatedEvent {
  constructor(
    public readonly conversationId: string,
    public readonly operatorId: string,
    public readonly updates: {
      name?: string;
      avatar?: string;
      announcement?: string;
      isMuteAll?: boolean;
    },
    public readonly syncType: string = 'PATCH', // 默认指令：局部修补名/头像
  ) {}
}

export class GroupMemberRoleUpdatedEvent {
  constructor(
    public readonly conversationId: string,
    public readonly operatorId: string,
    public readonly targetId: string, // 统一字段名
    public readonly newRole: 'ADMIN' | 'MEMBER',
    public readonly syncType: string = 'PATCH',
  ) {}
}

export class GroupDisbandedEvent {
  constructor(
    public readonly conversationId: string,
    public readonly operatorId: string,
    public readonly timestamp: number,
    public readonly syncType: string = 'REMOVE', // 默认指令：所有人移除会话
  ) {}
}

export class GroupMemberLeftEvent {
  constructor(
    public readonly conversationId: string,
    public readonly targetId: string, // 统一字段名 (退群者)
    public readonly timestamp: number,
    public readonly syncType: string = 'PATCH',
  ) {}
}

export class GroupMemberJoinedEvent {
  constructor(
    public readonly conversationId: string,
    public readonly operatorId: string,
    public readonly syncType: string, // 必填：决定是 PATCH 还是 FULL_SYNC
    public readonly member?: {
      // PATCH 模式带完整对象
      userId: string;
      nickname: string;
      avatar?: string;
      role: string;
    },
    public readonly targetIds?: string[], // 批量入群时只发 ID 列表
  ) {}
}
