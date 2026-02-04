export const CHAT_EVENTS = {
  /**
   * 聊天消息成功创建并入库后触发
   * 用于解耦：Socket 推送、FCM 离线推送、短信通知、审计日志等
   */
  MESSAGE_CREATED: 'chat.message.created',
};

export class MessageCreatedEvent {
  constructor(
    public readonly messageId: string,
    public readonly conversationId: string,
    public readonly content: string,
    public readonly type: number,
    public readonly senderId: string,
    // 这里保持扁平化没问题，方便存储或传输
    public readonly senderName: string,
    public readonly senderAvatar: string,
    public readonly createdAt: number,
    public readonly memberIds: string[],

    //  [新增] 必须补齐这些字段，否则前端会报错
    public readonly seqId: number,
    public readonly meta: any,
  ) {}
}
