// ==========================================
//  事件常量定义 (Event Constants)
// ==========================================
export const CHAT_GROUP_EVENTS = {
  // --- 1. 惩罚与管理 ---
  MEMBER_KICKED: 'chat.group.member_kicked', // 踢人
  MEMBER_MUTED: 'chat.group.member_muted', // 禁言

  // --- 2. 权限与角色 ---
  OWNER_TRANSFERRED: 'chat.group.owner_transferred', // 转让群主
  MEMBER_ROLE_UPDATED: 'chat.group.member_role_updated', // 升/降管理员

  // --- 3. 群信息变更 ---
  INFO_UPDATED: 'chat.group.info_updated', // 改名/公告/全员禁言

  // --- 4. 成员变动 (列表刷新用) ---
  MEMBER_JOINED: 'chat.group.member_joined', // 新人入群
  MEMBER_LEFT: 'chat.group.member_left', // 主动退群

  // --- 5. 群生命周期 ---
  GROUP_DISBANDED: 'chat.group.disbanded', // 群解散
};

// ==========================================
//  Payload 类定义 (Payload Definitions)
// ==========================================

// 1. 踢人事件 [补回]
export class GroupMemberKickedEvent {
  constructor(
    public readonly conversationId: string,
    public readonly operatorId: string, // 谁踢的
    public readonly kickedUserId: string, // 谁被踢了
    public readonly timestamp: number,
  ) {}
}

// 2. 禁言事件 [补回]
export class GroupMemberMutedEvent {
  constructor(
    public readonly conversationId: string,
    public readonly operatorId: string,
    public readonly targetUserId: string,
    public readonly mutedUntil: number | null, // null = 解除
  ) {}
}

// 3. 转让群主事件 [补回]
export class GroupOwnerTransferredEvent {
  constructor(
    public readonly conversationId: string,
    public readonly operatorId: string, // 旧群主
    public readonly newOwnerId: string, // 新群主
  ) {}
}

// 4. 群信息变更事件 [补回]
export class GroupInfoUpdatedEvent {
  constructor(
    public readonly conversationId: string,
    public readonly operatorId: string,
    public readonly updates: {
      name?: string;
      announcement?: string;
      isMuteAll?: boolean;
      joinNeedApproval?: boolean;
    },
  ) {}
}

// 5. 角色变更事件 (升职/降职)
export class GroupMemberRoleUpdatedEvent {
  constructor(
    public readonly conversationId: string,
    public readonly operatorId: string,
    public readonly targetUserId: string,
    public readonly newRole: 'ADMIN' | 'MEMBER',
  ) {}
}

// 6. 群解散事件
export class GroupDisbandedEvent {
  constructor(
    public readonly conversationId: string,
    public readonly operatorId: string,
    public readonly timestamp: number,
  ) {}
}

// 7. 成员主动退群事件
export class GroupMemberLeftEvent {
  constructor(
    public readonly conversationId: string,
    public readonly userId: string,
    public readonly timestamp: number,
  ) {}
}

// 8. 新成员加入事件
export class GroupMemberJoinedEvent {
  constructor(
    public readonly conversationId: string,
    public readonly member: {
      userId: string;
      nickname: string;
      avatar?: string;
      role: string;
      joinedAt: number;
    },
    public readonly inviterId?: string,
  ) {}
}
