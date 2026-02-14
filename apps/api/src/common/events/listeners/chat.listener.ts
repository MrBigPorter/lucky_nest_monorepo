import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventsGateway } from '@api/common/events/events.gateway';
import { SocketEvents } from '@lucky/shared';
import * as G from '@api/common/chat/events/chat-group.events';

@Injectable()
export class ChatListener {
  constructor(private readonly eventsGateway: EventsGateway) {}

  // ========================================================
  // 1. 群信息变更 (Info Updated)
  // ========================================================
  @OnEvent(G.CHAT_GROUP_EVENTS.INFO_UPDATED)
  handleInfoUpdated(payload: G.GroupInfoUpdatedEvent) {
    // 房间广播：所有成员收到后，更新本地数据库的群名/头像
    this.eventsGateway.dispatch(
      payload.conversationId,
      SocketEvents.GROUP_INFO_UPDATED,
      payload,
    );
  }

  // ========================================================
  // 2. 成员退群 (Member Left)
  // ========================================================
  @OnEvent(G.CHAT_GROUP_EVENTS.MEMBER_LEFT)
  handleMemberLeft(payload: G.GroupMemberLeftEvent) {
    // A. 房间广播：告诉剩下的人，某人走了
    this.eventsGateway.dispatch(
      payload.conversationId,
      SocketEvents.MEMBER_LEFT,
      payload,
    );

    // B. 定向通知：强制告诉退群者本人 (因为他可能已经不在 Socket 房间列表里了)
    // 前端逻辑：收到是自己 -> deleteConversation
    this.eventsGateway.dispatch(
      `user_${payload.targetId}`,
      SocketEvents.MEMBER_LEFT,
      {
        ...payload,
        isSelf: true, // 标记位
      },
    );
  }

  // ========================================================
  // 3. 成员被踢 (Member Kicked)
  // ========================================================
  @OnEvent(G.CHAT_GROUP_EVENTS.MEMBER_KICKED)
  handleMemberKicked(payload: G.GroupMemberKickedEvent) {
    // A. 房间广播：告诉剩下的人，某人被踢了
    this.eventsGateway.dispatch(
      payload.conversationId,
      SocketEvents.MEMBER_KICKED,
      payload,
    );

    // B. 定向通知：强制告诉被踢者本人
    this.eventsGateway.dispatch(
      `user_${payload.targetId}`,
      SocketEvents.MEMBER_KICKED,
      {
        ...payload,
        isSelf: true,
      },
      payload.conversationId,
    );
  }

  // ========================================================
  // 4.  [重点修改] 成员进群 (Member Joined)
  // ========================================================
  @OnEvent(G.CHAT_GROUP_EVENTS.MEMBER_JOINED)
  handleMemberJoined(payload: G.GroupMemberJoinedEvent) {
    // A. 房间广播 (给老成员看)
    // -------------------------------------------------
    // 老成员收到后：
    // 1. 如果 syncType == PATCH，直接把 payload.members 加进列表
    // 2. 如果 syncType == MEMBER_SYNC，去拉 API
    this.eventsGateway.dispatch(
      payload.conversationId,
      SocketEvents.MEMBER_JOINED,
      payload,
    );

    // B. 定向通知 (给新成员看)
    // -------------------------------------------------
    // 新人此时还不在 Socket 的 conversationId 房间里，必须发给 user_ID 频道
    // 且事件名由 MEMBER_JOINED 改为 CONVERSATION_ADDED
    if (payload.targetIds && payload.targetIds.length > 0) {
      payload.targetIds.forEach((newUserId) => {
        this.eventsGateway.dispatch(
          `user_${newUserId}`,
          SocketEvents.CONVERSATION_ADDED, //  告诉新人：你多了一个会话
          {
            conversationId: payload.conversationId,
            operatorId: payload.operatorId,
            timestamp: Date.now(),
            // 可以带上简单的群信息，防止前端这就去拉接口
            // (或者前端收到 ADDED 事件后统一去拉详情)
          },
        );
      });
    }
  }

  // ========================================================
  // 5. 成员禁言 (Member Muted)
  // ========================================================
  @OnEvent(G.CHAT_GROUP_EVENTS.MEMBER_MUTED)
  handleMemberMuted(payload: G.GroupMemberMutedEvent) {
    this.eventsGateway.dispatch(
      payload.conversationId,
      SocketEvents.MEMBER_MUTED,
      payload,
    );
  }

  // ========================================================
  // 6. 成员角色变更 (Role Updated)
  // ========================================================
  @OnEvent(G.CHAT_GROUP_EVENTS.MEMBER_ROLE_UPDATED)
  handleMemberRoleUpdated(payload: G.GroupMemberRoleUpdatedEvent) {
    this.eventsGateway.dispatch(
      payload.conversationId,
      SocketEvents.MEMBER_ROLE_UPDATED,
      payload,
    );
  }

  // ========================================================
  // 7. 群主转让 (Owner Transferred)
  // ========================================================
  @OnEvent(G.CHAT_GROUP_EVENTS.OWNER_TRANSFERRED)
  handleOwnerTransferred(payload: G.GroupOwnerTransferredEvent) {
    this.eventsGateway.dispatch(
      payload.conversationId,
      SocketEvents.OWNER_TRANSFERRED,
      payload,
    );
  }

  // ========================================================
  // 8. 群解散 (Group Disbanded)
  // ========================================================
  @OnEvent(G.CHAT_GROUP_EVENTS.GROUP_DISBANDED)
  handleGroupDisbanded(payload: G.GroupDisbandedEvent) {
    this.eventsGateway.dispatch(
      payload.conversationId,
      SocketEvents.GROUP_DISBANDED,
      payload,
    );
  }

  // ========================================================
  // 9. 有新入群申请 (Group Apply New)
  // ========================================================
  @OnEvent(G.CHAT_GROUP_EVENTS.APPLY_NEW)
  handleGroupApplyNew(payload: G.GroupApplyNewEvent) {
    // 逻辑：向每一个管理员的私有房间发送信号
    payload.adminIds.forEach((adminId) => {
      this.eventsGateway.dispatchToUser(
        adminId,
        SocketEvents.GROUP_APPLY_NEW,
        payload,
      );
    });
  }
  // ========================================================
  // 10. 申请处理结果 (Group Apply Result)
  // ========================================================
  @OnEvent(G.CHAT_GROUP_EVENTS.APPLY_RESULT)
  handleGroupApplyResult(payload: G.GroupApplyResultEvent) {
    this.eventsGateway.dispatchToUser(
      payload.applicantId,
      SocketEvents.GROUP_APPLY_RESULT,
      payload,
    );

    if (payload.approved) {
      this.eventsGateway.dispatchToUser(
        payload.applicantId,
        SocketEvents.CONVERSATION_ADDED,
        {
          conversationId: payload.conversationId,
          syncType: 'full_sync',
        },
      );
    }
  }

  // ========================================================
  // 11. 申请已被处理同步 (Request Handled Sync)
  // ========================================================
  @OnEvent(G.CHAT_GROUP_EVENTS.REQUEST_HANDLED)
  handleRequestHandled(payload: G.GroupRequestHandledEvent) {
    // 通知其他管理员，同步 UI 状态（按钮置灰）
    payload.adminIds.forEach((adminId) => {
      this.eventsGateway.dispatchToUser(
        adminId,
        SocketEvents.GROUP_REQUEST_HANDLED,
        payload,
      );
    });
  }
}
