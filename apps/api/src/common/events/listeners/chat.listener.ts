import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventsGateway } from '@api/common/events/events.gateway';
import { SocketEvents } from '@lucky/shared';
import * as G from '@api/common/chat/events/chat-group.events';

@Injectable()
export class ChatListener {
  constructor(private readonly eventsGateway: EventsGateway) {}

  @OnEvent(G.CHAT_GROUP_EVENTS.INFO_UPDATED)
  handleInfoUpdated(payload: G.GroupInfoUpdatedEvent) {
    // 只发房间广播 (PATCH)，前端收到后直接改内存中的名字
    this.eventsGateway.dispatch(
      payload.conversationId,
      SocketEvents.GROUP_INFO_UPDATED,
      payload,
    );
  }

  @OnEvent(G.CHAT_GROUP_EVENTS.MEMBER_KICKED)
  handleMemberKicked(payload: G.GroupMemberKickedEvent) {
    // 1. 房间广播：告诉在场的人谁走了 (PATCH)
    this.eventsGateway.dispatch(
      payload.conversationId,
      SocketEvents.MEMBER_KICKED,
      payload,
    );
    // 2. 定向通知：告诉被踢的人删掉会话 (REMOVE)
    this.eventsGateway.dispatch(
      `user_${payload.targetId}`,
      SocketEvents.MEMBER_KICKED,
      payload,
      payload.conversationId,
    );
  }

  @OnEvent(G.CHAT_GROUP_EVENTS.MEMBER_JOINED)
  handleMemberJoined(payload: G.GroupMemberJoinedEvent) {
    // 1. 房间广播 (PATCH)
    this.eventsGateway.dispatch(
      payload.conversationId,
      SocketEvents.MEMBER_JOINED,
      payload,
    );
    // 2. 定向通知：如果是新人，发 FULL_SYNC 让他拉一次列表
    if (payload.member) {
      this.eventsGateway.dispatch(
        `user_${payload.member.userId}`,
        SocketEvents.MEMBER_JOINED,
        payload,
      );
    }
  }

  @OnEvent(G.CHAT_GROUP_EVENTS.GROUP_DISBANDED)
  handleGroupDisbanded(payload: G.GroupDisbandedEvent) {
    // 房间广播：所有人 REMOVE
    this.eventsGateway.dispatch(
      payload.conversationId,
      SocketEvents.GROUP_DISBANDED,
      payload,
    );
  }
}
