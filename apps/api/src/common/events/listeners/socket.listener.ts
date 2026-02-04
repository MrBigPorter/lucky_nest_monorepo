import { SocketEvents } from '@lucky/shared';
import {
  CHAT_EVENTS,
  MessageCreatedEvent,
} from '@api/common/chat/events/chat.events';
import { OnEvent } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { EventsGateway } from '@api/common/events/events.gateway';

@Injectable()
export class SocketListener {
  constructor(private readonly eventsGateway: EventsGateway) {}

  @OnEvent(CHAT_EVENTS.MESSAGE_CREATED)
  handleSocketDispatch(event: MessageCreatedEvent) {
    //  [适配器模式] 核心：在这里把数据“整容”成前端熟悉的样子
    // 完全复刻原 ChatService 里的 messageDto 结构
    const socketPayload = {
      id: event.messageId,
      conversationId: event.conversationId,
      senderId: event.senderId, // 前端可能需要这个
      content: event.content,
      type: event.type,
      seqId: event.seqId, // 补上 seqId
      createdAt: event.createdAt,
      isRecalled: false, // 默认值
      meta: event.meta, // 补上 meta

      sender: {
        id: event.senderId,
        nickname: event.senderName,
        avatar: event.senderAvatar,
      },

      isSelf: false, // Socket 推送过来的，对接收者来说肯定不是自己发的
    };

    // 1. 广播给房间
    this.eventsGateway.dispatch(
      event.conversationId,
      SocketEvents.CHAT_MESSAGE,
      socketPayload,
    );

    // 2. 广播给列表预览
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
