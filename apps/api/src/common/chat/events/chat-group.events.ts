// ==========================================
//  事件常量定义 (Event Constants)
// ==========================================
import { GroupJoinRequestStatus, SocketSyncTypes } from '@lucky/shared';

export const CHAT_GROUP_EVENTS = {
  MEMBER_KICKED: 'chat.group.member_kicked',
  MEMBER_MUTED: 'chat.group.member_muted',
  OWNER_TRANSFERRED: 'chat.group.owner_transferred',
  MEMBER_ROLE_UPDATED: 'chat.group.member_role_updated',
  INFO_UPDATED: 'chat.group.info_updated',
  MEMBER_JOINED: 'chat.group.member_joined',
  MEMBER_LEFT: 'chat.group.member_left',
  GROUP_DISBANDED: 'chat.group.disbanded',

  APPLY_NEW: 'chat.group.apply_new', // 有新申请 (发给管理员)
  APPLY_RESULT: 'chat.group.apply_result', // 申请结果 (发给申请人)
  REQUEST_HANDLED: 'chat.group.request_handled', // 申请已被处理 (发给管理员同步 UI)
};

/**
 * 1. 申请入群事件 (由用户发起)
 */
export class GroupApplyNewEvent {
  constructor(
    public readonly conversationId: string, // 统一使用 conversationId
    public readonly applicantId: string,
    public readonly nickname: string,
    public readonly avatar: string | null,
    public readonly reason: string,
    public readonly timestamp: number,
    public readonly adminIds: string[], // 路由目标：管理员们
    public readonly syncType: SocketSyncTypes = SocketSyncTypes.PATCH,
  ) {}
}

/**
 * 2. 审批结果事件 (由管理员发出)
 */
export class GroupApplyResultEvent {
  constructor(
    public readonly conversationId: string, // 统一使用 conversationId
    public readonly applicantId: string,
    public readonly groupName: string,
    public readonly approved: boolean,
    public readonly timestamp: number,
    public readonly syncType: SocketSyncTypes = SocketSyncTypes.PATCH,
  ) {}
}

/**
 * 3. 审批同步事件 (发给其他管理员)
 */
export class GroupRequestHandledEvent {
  constructor(
    public readonly requestId: string,
    public readonly conversationId: string, // 统一使用 conversationId
    public readonly status: GroupJoinRequestStatus,
    public readonly handlerId: string,
    public readonly handlerName: string,
    public readonly timestamp: number,
    public readonly adminIds: string[], // 路由目标：其他管理员
    public readonly syncType: SocketSyncTypes = SocketSyncTypes.PATCH,
  ) {}
}

// ==========================================
//  Payload 类定义 (已统一 targetId 和 syncType)
// ==========================================

export class GroupMemberKickedEvent {
  constructor(
    public readonly conversationId: string,
    public readonly operatorId: string,
    public readonly targetId: string, // 统一字段名
    public readonly timestamp: number,
    public readonly syncType: SocketSyncTypes = SocketSyncTypes.REMOVE,
  ) {}
}

export class GroupMemberMutedEvent {
  constructor(
    public readonly conversationId: string,
    public readonly operatorId: string,
    public readonly targetId: string, // 统一字段名
    public readonly mutedUntil: number | null,
    public readonly syncType: SocketSyncTypes = SocketSyncTypes.PATCH,
  ) {}
}

export class GroupOwnerTransferredEvent {
  constructor(
    public readonly conversationId: string,
    public readonly operatorId: string,
    public readonly targetId: string, // 统一字段名 (新群主)
    public readonly syncType: SocketSyncTypes = SocketSyncTypes.PATCH,
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
    public readonly syncType: SocketSyncTypes = SocketSyncTypes.PATCH,
  ) {}
}

export class GroupMemberRoleUpdatedEvent {
  constructor(
    public readonly conversationId: string,
    public readonly operatorId: string,
    public readonly targetId: string, // 统一字段名
    public readonly newRole: 'ADMIN' | 'MEMBER',
    public readonly syncType: SocketSyncTypes = SocketSyncTypes.PATCH,
  ) {}
}

export class GroupDisbandedEvent {
  constructor(
    public readonly conversationId: string,
    public readonly operatorId: string,
    public readonly timestamp: number,
    public readonly syncType: SocketSyncTypes = SocketSyncTypes.REMOVE,
  ) {}
}

export class GroupMemberLeftEvent {
  constructor(
    public readonly conversationId: string,
    public readonly targetId: string, // 统一字段名 (退群者)
    public readonly timestamp: number,
    public readonly syncType: SocketSyncTypes = SocketSyncTypes.PATCH,
  ) {}
}

export class GroupMemberJoinedEvent {
  constructor(
    public readonly conversationId: string,
    public readonly operatorId: string,

    // 1. 必填：决定前端行为
    public readonly syncType: SocketSyncTypes, // 默认指令：局部修补成员列表

    // 2. 变更点：改为数组，支持一次拉多人时把头像昵称都带过去
    public readonly members: Array<{
      userId: string;
      nickname: string;
      avatar?: string;
      role: string;
    }> = [],

    // 3. 必填：无论 members 是否为空，这里都必须包含所有新人的 ID
    // Listener 用它来遍历发送 "CONVERSATION_ADDED"
    public readonly targetIds: string[] = [],
  ) {}
}
