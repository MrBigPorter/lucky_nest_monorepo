import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventsGateway } from '@api/common/events/events.gateway';
import {
  CHAT_GROUP_EVENTS,
  GroupDisbandedEvent,
  GroupInfoUpdatedEvent,
  GroupMemberJoinedEvent,
  GroupMemberKickedEvent,
  GroupMemberLeftEvent,
  GroupMemberMutedEvent,
  GroupMemberRoleUpdatedEvent,
  GroupOwnerTransferredEvent,
} from '@api/common/chat/events/chat-group.events';
import { SocketEvents } from '@lucky/shared';

@Injectable()
export class ChatListener {
  private readonly logger = new Logger(ChatListener.name);

  constructor(private readonly eventsGateway: EventsGateway) {}

  // ===========================================================================
  // 1. 踢人 (Member Kicked)
  // ===========================================================================
  @OnEvent(CHAT_GROUP_EVENTS.MEMBER_KICKED)
  handleMemberKicked(payload: GroupMemberKickedEvent) {
    this.eventsGateway.dispatch(
      payload.conversationId, // 目标房间
      SocketEvents.MEMBER_KICKED,
      {
        conversationId: payload.conversationId,
        kickedUserId: payload.kickedUserId,
        operatorId: payload.operatorId,
        timestamp: payload.timestamp,
      },
    );
  }

  // ===========================================================================
  // 2. 禁言 (Member Muted)
  // ===========================================================================
  @OnEvent(CHAT_GROUP_EVENTS.MEMBER_MUTED)
  handleMemberMuted(payload: GroupMemberMutedEvent) {
    this.eventsGateway.dispatch(
      payload.conversationId,
      SocketEvents.MEMBER_MUTED,
      {
        conversationId: payload.conversationId,
        targetUserId: payload.targetUserId,
        mutedUntil: payload.mutedUntil,
        operatorId: payload.operatorId,
      },
    );
  }

  // ===========================================================================
  // 3. 角色变更 (Role Updated)
  // ===========================================================================
  @OnEvent(CHAT_GROUP_EVENTS.MEMBER_ROLE_UPDATED)
  handleRoleUpdated(payload: GroupMemberRoleUpdatedEvent) {
    this.eventsGateway.dispatch(
      payload.conversationId,
      SocketEvents.MEMBER_ROLE_UPDATED,
      {
        conversationId: payload.conversationId,
        targetUserId: payload.targetUserId,
        newRole: payload.newRole,
        operatorId: payload.operatorId,
      },
    );
  }

  // ===========================================================================
  // 4. 转让群主 (Owner Transferred)
  // ===========================================================================
  @OnEvent(CHAT_GROUP_EVENTS.OWNER_TRANSFERRED)
  handleOwnerTransferred(payload: GroupOwnerTransferredEvent) {
    this.eventsGateway.dispatch(
      payload.conversationId,
      SocketEvents.OWNER_TRANSFERRED,
      {
        conversationId: payload.conversationId,
        newOwnerId: payload.newOwnerId,
        operatorId: payload.operatorId,
      },
    );
  }

  // ===========================================================================
  // 5. 群信息更新 (Info Updated)
  // ===========================================================================
  @OnEvent(CHAT_GROUP_EVENTS.INFO_UPDATED)
  handleInfoUpdated(payload: GroupInfoUpdatedEvent) {
    this.eventsGateway.dispatch(
      payload.conversationId,
      SocketEvents.GROUP_INFO_UPDATED,
      {
        conversationId: payload.conversationId,
        updates: payload.updates,
        operatorId: payload.operatorId,
      },
    );
  }

  // ===========================================================================
  // 6. 群解散 (Group Disbanded)
  // ===========================================================================
  @OnEvent(CHAT_GROUP_EVENTS.GROUP_DISBANDED)
  handleGroupDisbanded(payload: GroupDisbandedEvent) {
    this.eventsGateway.dispatch(
      payload.conversationId,
      SocketEvents.GROUP_DISBANDED,
      {
        conversationId: payload.conversationId,
        operatorId: payload.operatorId,
        timestamp: payload.timestamp,
      },
    );

    //  注意：EventsGateway 封装后可能没有直接暴露 disconnectSockets 方法
    // 如果需要强制断开，可能需要扩展 EventsGateway 或者接受这一步由前端处理
    this.eventsGateway.server
      .in(payload.conversationId)
      .disconnectSockets(true);
  }

  // ===========================================================================
  // 7. 成员退群 (Member Left)
  // ===========================================================================
  @OnEvent(CHAT_GROUP_EVENTS.MEMBER_LEFT)
  handleMemberLeft(payload: GroupMemberLeftEvent) {
    this.eventsGateway.dispatch(
      payload.conversationId,
      SocketEvents.MEMBER_LEFT,
      {
        conversationId: payload.conversationId,
        userId: payload.userId,
        timestamp: payload.timestamp,
      },
    );
  }

  // ===========================================================================
  // 8. 新成员入群 (Member Joined)
  // ===========================================================================
  @OnEvent(CHAT_GROUP_EVENTS.MEMBER_JOINED)
  handleMemberJoined(payload: GroupMemberJoinedEvent) {
    this.eventsGateway.dispatch(
      payload.conversationId,
      SocketEvents.MEMBER_JOINED,
      {
        conversationId: payload.conversationId,
        member: payload.member,
        inviterId: payload.inviterId,
      },
    );
  }
}
