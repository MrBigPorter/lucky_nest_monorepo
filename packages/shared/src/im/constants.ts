/** 会话类型（与 Prisma enum ConversationType 对齐） */
export const CONVERSATION_TYPE = {
  GROUP: "GROUP",
  DIRECT: "DIRECT",
  SUPPORT: "SUPPORT",
  BUSINESS: "BUSINESS",
} as const;

export type ConversationType =
  (typeof CONVERSATION_TYPE)[keyof typeof CONVERSATION_TYPE];

export enum ConversationStatus {
  NORMAL = 1,
  ARCHIVED = 2,
  MUTED = 3,
}

export enum ChatMemberRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

/** 消息类型（与 ChatMessage.type 对齐） */
export const MESSAGE_TYPE = {
  TEXT: 0,
  IMAGE: 1,
  AUDIO: 2,
  VIDEO: 3,
  RECALLED: 4,
  //  新增：文件类型
  FILE: 5,
  //  新增：位置类型
  LOCATION: 6,

  SYSTEM: 99,
} as const;

export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];

/** 系统消息约定：senderId 为 null */
export const SYSTEM_SENDER_ID = null as null;

/** Conversation.lastMsgType 的默认值 */
export const DEFAULT_LAST_MSG_TYPE: MessageType = MESSAGE_TYPE.TEXT;

/** Conversation.lastMsgSeqId / ChatMember.lastReadSeqId 的默认值 */
export const DEFAULT_SEQ_ID = 0;

/** 未读数计算（约定公式） */
export const getUnreadCount = (args: {
  lastMsgSeqId: number;
  lastReadSeqId: number;
}) => Math.max(0, args.lastMsgSeqId - args.lastReadSeqId);

/** 关键字段名（写查询/排序/索引用，减少 magic string） */
export const IM_FIELDS = {
  Conversation: {
    id: "id",
    type: "type",
    businessId: "businessId",
    lastMsgContent: "lastMsgContent",
    lastMsgType: "lastMsgType",
    lastMsgTime: "lastMsgTime",
    lastMsgSeqId: "lastMsgSeqId",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  },
  ChatMessage: {
    id: "id",
    conversationId: "conversationId",
    senderId: "senderId",
    type: "type",
    content: "content",
    meta: "meta",
    seqId: "seqId",
    clientTempId: "clientTempId",
    isRecalled: "isRecalled",
    createdAt: "createdAt",
  },
  ChatMember: {
    id: "id",
    conversationId: "conversationId",
    userId: "userId",
    lastReadSeqId: "lastReadSeqId",
    joinedAt: "joinedAt",
  },
} as const;

/** 索引/约束名（用于文档 & 迁移沟通；Prisma 不一定显式命名，但业务层可以统一口径） */
export const IM_CONSTRAINTS = {
  Conversation: {
    businessIdUnique: "Conversation_businessId_unique",
  },
  ChatMessage: {
    conversationIdSeqIdIndex: "ChatMessage_conversationId_seqId_index",
  },
  ChatMember: {
    conversationIdUserIdUnique: "ChatMember_conversationId_userId_unique",
  },
} as const;

/** meta Json 推荐字段（方便前端类型收敛） */
export type MessageMeta = {
  // === 通用/图片/视频 ===
  w?: number; // 宽
  h?: number; // 高
  duration?: number; // 时长 (语音/视频)
  blurHash?: string; //  补全：模糊占位符
  thumb?: string; //  补全：缩略图/封面

  // ===  新增：文件消息字段 ===
  fileName?: string; // 文件名
  fileSize?: number; // 文件大小 (字节)
  fileExt?: string; // 文件后缀 (e.g. pdf)

  // ===  新增：位置消息字段 ===
  latitude?: number; // 纬度
  longitude?: number; // 经度
  address?: string; // 详细地址

  // === 前端辅助 ===
  localAssetId?: string; // 本地资产引用 (用于乐观 UI)
};

export enum SocketEvents {
  //  Chat
  CHAT_MESSAGE = "chat_message",
  CONVERSATION_READ = "conversation_read",
  MESSAGE_RECALLED = "message_recalled",

  //  Group
  JOIN_CHAT = "join_chat",
  LEAVE_CHAT = "leave_chat",
  SEND_MESSAGE = "send_message",
}
