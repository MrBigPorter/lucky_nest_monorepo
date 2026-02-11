import { SocketEvents } from '@lucky/shared';
import {
  CHAT_EVENTS,
  ConversationReadEvent,
  MessageCreatedEvent,
  MessageRecalledEvent,
} from '@api/common/chat/events/chat.events';
import { OnEvent } from '@nestjs/event-emitter';
import { Injectable, Logger } from '@nestjs/common';
import { EventsGateway } from '@api/common/events/events.gateway';

@Injectable()
export class SocketListener {
  private readonly logger = new Logger(SocketListener.name);

  constructor(private readonly eventsGateway: EventsGateway) {}

  // ===========================================================================
  // 1. 处理新消息 (Message Created)
  // ===========================================================================
  @OnEvent(CHAT_EVENTS.MESSAGE_CREATED)
  handleMessageCreated(event: MessageCreatedEvent) {
    const socketPayload = {
      id: event.messageId,
      conversationId: event.conversationId,
      senderId: event.senderId,
      content: event.content,
      type: event.type,
      seqId: event.seqId,
      createdAt: event.createdAt,
      isRecalled: false,
      meta: event.meta,
      sender: {
        id: event.senderId,
        nickname: event.senderName,
        avatar: event.senderAvatar,
      },
      isSelf: false,
    };

    //  A. 房间广播 (O(1))
    this.eventsGateway.dispatch(
      event.conversationId,
      SocketEvents.CHAT_MESSAGE,
      socketPayload,
    );

    //  B. 列表预览：只针对小群或在线个人进行分发
    // 设定阈值（如100人），超过此人数的群不再执行 forEach 个人分发，靠“前台自愈”同步
    if (event.memberIds.length < 100) {
      event.memberIds.forEach((userId) => {
        if (userId !== event.senderId) {
          this.eventsGateway.dispatch(
            `user_${userId}`,
            SocketEvents.CHAT_MESSAGE,
            socketPayload,
          );
        }
      });
    }
  }

  // ===========================================================================
  // 2. 处理消息撤回 (Message Recalled) [NEW]
  // ===========================================================================
  @OnEvent(CHAT_EVENTS.MESSAGE_RECALLED)
  handleMessageRecall(event: MessageRecalledEvent) {
    const recallPayload = {
      conversationId: event.conversationId,
      messageId: event.messageId,
      tip: 'A message was recalled',
      operatorId: event.operatorId,
      seqId: event.seqId,
    };

    // A. 广播给房间 (实时撤回)
    this.eventsGateway.dispatch(
      event.conversationId,
      SocketEvents.MESSAGE_RECALLED,
      { ...recallPayload, isSelf: false },
    );

    // B. 广播给成员列表 (更新最后一条消息预览)
    event.memberIds.forEach((userId) => {
      // 这里的 dispatch 对应前端列表页的更新
      this.eventsGateway.dispatch(
        `user_${userId}`,
        SocketEvents.MESSAGE_RECALLED,
        {
          ...recallPayload,
          isSelf: event.operatorId === userId, // 标记是不是自己撤回的
        },
        event.conversationId,
      );
    });
  }

  // ===========================================================================
  // 3. 处理会话已读 (Conversation Read) [NEW]
  // ===========================================================================
  @OnEvent(CHAT_EVENTS.CONVERSATION_READ)
  handleConversationRead(event: ConversationReadEvent) {
    const readPayload = {
      conversationId: event.conversationId,
      readerId: event.readerId,
      lastReadSeqId: event.lastReadSeqId,
    };

    // 只需要广播给房间
    // 房间里的其他人收到后，会把那个人的消息标记为双勾
    // 房间里的自己收到后（多端同步），会消除红点
    this.eventsGateway.dispatch(
      event.conversationId,
      SocketEvents.CONVERSATION_READ,
      readPayload,
    );
  }
}
