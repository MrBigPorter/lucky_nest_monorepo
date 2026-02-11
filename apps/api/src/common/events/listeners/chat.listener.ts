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
  GroupMemberRoleUpdatedEvent,
  GroupOwnerTransferredEvent,
} from '@api/common/chat/events/chat-group.events';
import { SocketEvents } from '@lucky/shared';
import { PrismaService } from '@api/common/prisma/prisma.service';

@Injectable()
export class ChatListener {
  private readonly logger = new Logger(ChatListener.name);

  constructor(
    private readonly eventsGateway: EventsGateway,
    private readonly prismaService: PrismaService,
  ) {}

  // ===========================================================================
  // 1. 踢人 (Member Kicked)
  // ===========================================================================
  @OnEvent(CHAT_GROUP_EVENTS.MEMBER_KICKED)
  handleMemberKicked(payload: GroupMemberKickedEvent) {
    const { conversationId, kickedUserId, operatorId, timestamp } = payload;
    this.eventsGateway.dispatch(conversationId, SocketEvents.MEMBER_KICKED, {
      conversationId: conversationId,
      operatorId: operatorId, // 谁踢的
      targetId: kickedUserId, //  统一叫 targetId
      timestamp: timestamp,
    });
    this.eventsGateway.dispatch(
      `user_${kickedUserId}`,
      SocketEvents.MEMBER_KICKED,
      {
        conversationId,
        targetId: kickedUserId,
      },
      conversationId, // 排除房间内发送
    );
  }

  // ===========================================================================
  // 2. 禁言 (Member Muted)
  // ===========================================================================

  @OnEvent(CHAT_GROUP_EVENTS.INFO_UPDATED)
  async handleInfoUpdated(payload: GroupInfoUpdatedEvent) {
    const { conversationId, operatorId, updates } = payload;

    // 1. 发给“正在看群的人” (房间广播)
    this.eventsGateway.dispatch(
      conversationId,
      SocketEvents.GROUP_INFO_UPDATED,
      { conversationId, operatorId, updates },
    );

    // 2. 查出群成员
    const members = await this.prismaService.chatMember.findMany({
      where: { conversationId },
      select: { userId: true },
    });

    // 3. 发给“列表页的人”，并使用 .except() 排除掉已经在房间里的人
    //  这是解决“重负实行”和“列表不刷新”的关键
    for (const member of members) {
      this.eventsGateway.dispatch(
        `user_${member.userId}`,
        SocketEvents.GROUP_INFO_UPDATED,
        {
          conversationId,
          operatorId,
          updates,
        },
        conversationId,
      );
    }
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
        operatorId: payload.operatorId,
        targetId: payload.targetUserId, //  统一叫 targetId
        newRole: payload.newRole,
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
        operatorId: payload.operatorId,
        targetId: payload.newOwnerId, //  统一叫 targetId (新群主)
      },
    );
  }

  // ===========================================================================
  // 6. 群解散 (Group Disbanded)
  // ===========================================================================
  @OnEvent(CHAT_GROUP_EVENTS.GROUP_DISBANDED)
  async handleGroupDisbanded(payload: GroupDisbandedEvent) {
    const { conversationId } = payload;
    const members = await this.prismaService.chatMember.findMany({
      where: { conversationId },
      select: { userId: true },
    });

    // 2.  给每个人发通知
    for (const m of members) {
      this.eventsGateway.dispatch(
        `user_${m.userId}`,
        SocketEvents.GROUP_DISBANDED,
        {
          conversationId,
        },
        conversationId,
      );
    }
    // 强制断开连接
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
        operatorId: payload.userId, // 主动退群，操作人是自己
        targetId: payload.userId, //  目标也是自己
        timestamp: payload.timestamp,
      },
    );
  }

  // ===========================================================================
  // 8. 新成员入群 (Member Joined)
  // ===========================================================================
  @OnEvent(CHAT_GROUP_EVENTS.MEMBER_JOINED)
  handleMemberJoined(payload: GroupMemberJoinedEvent) {
    const { conversationId, member } = payload;
    this.eventsGateway.dispatch(
      payload.conversationId,
      SocketEvents.MEMBER_JOINED,
      {
        conversationId: payload.conversationId,
        operatorId: payload.inviterId, // 邀请人
        targetId: payload.member.userId, // 新加入的人
        member: payload.member, // 依然需要完整的 member 对象用于 UI 展示
      },
    );

    // 因为他之前不在群里，没加入 Socket 房间，必须点对点告诉他：你入伙了
    this.eventsGateway.dispatch(
      `user_${member.userId}`,
      SocketEvents.MEMBER_JOINED,
      {
        conversationId,
        member,
      },
    );
  }
}
