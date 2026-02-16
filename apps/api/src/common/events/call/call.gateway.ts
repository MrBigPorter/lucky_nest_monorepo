import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  CallAcceptDto,
  CallEndDto,
  CallIceCandidateDto,
  CallInviteDto,
} from '@api/common/events/call/dto/call-signaling.dto';

@WebSocketGateway({
  namespace: 'events',
  cors: { origin: '*' },
})
export class CallGateway {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(CallGateway.name);

  /**
   * 辅助方法：安全获取当前 Socket 的用户 ID
   * (该 ID 是由 EventsGateway 在 handleConnection 时挂载的)
   */
  private getUserId(client: Socket): string | null {
    return (client as any).userId || null;
  }

  // ==========================================
  // 1. 发起呼叫 (Invite)
  // ==========================================
  @SubscribeMessage('call_invite')
  handleCallInvite(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CallInviteDto,
  ) {
    const senderId = this.getUserId(client);
    if (!senderId) {
      this.logger.warn(
        `Call Invite rejected: No User ID on socket ${client.id}`,
      );
      return;
    }

    this.logger.log(
      `📞 [Call Invite] ${senderId} -> ${payload.targetId} (Session: ${payload.sessionId})`,
    );

    // 目标用户的私有房间名 (与 EventsGateway 保持一致)
    const targetRoom = `user_${payload.targetId}`;
    // 转发消息给目标
    // 注意：我们将 senderId 附带在消息中，这样接收方知道是谁打来的
    this.server.to(targetRoom).emit('call_invite', {
      ...payload, // 包含 sessionId, sdp, mediaType
      senderId, // 补充发送者 ID
    });
  }

  // ==========================================
  // 2. 接听呼叫 (Accept/Answer)
  // ==========================================
  @SubscribeMessage('call_accept')
  handleCallAccept(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CallAcceptDto,
  ) {
    const senderId = this.getUserId(client);
    if (!senderId) {
      this.logger.warn(
        `Call Accept rejected: No User ID on socket ${client.id}`,
      );
      return;
    }

    this.logger.log(
      ` [Call Accept] ${senderId} -> ${payload.targetId} (Session: ${payload.sessionId})`,
    );

    const targetRoom = `user_${payload.targetId}`;

    // 转发 Answer SDP 给发起方
    this.server.to(targetRoom).emit('call_accept', {
      ...payload, // 包含 sdp, sessionId
      senderId,
    });
  }

  // ==========================================
  // 3. ICE 候选者交换 (Ice Candidate)
  // ==========================================
  @SubscribeMessage('call_ice')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CallIceCandidateDto,
  ) {
    const senderId = this.getUserId(client);
    if (!senderId) return;

    // ICE 交换非常频繁，通常仅在 debug 模式下打印日志，或者不打印
    this.logger.debug(`❄️ [ICE] ${senderId} -> ${payload.targetId}`);

    const targetRoom = `user_${payload.targetId}`;

    this.server.to(targetRoom).emit('call_ice', {
      ...payload, // 包含 candidate, sdpMid, sdpMLineIndex
      senderId,
    });
  }

  // ==========================================
  // 4. 挂断/拒绝/取消 (End)
  // ==========================================
  @SubscribeMessage('call_end')
  handleCallEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CallEndDto,
  ) {
    const senderId = this.getUserId(client);
    if (!senderId) return;

    this.logger.log(
      `🛑 [Call End] ${senderId} -> ${payload.targetId} (Reason: ${payload.reason})`,
    );

    const targetRoom = `user_${payload.targetId}`;
    this.server.to(targetRoom).emit('call_end', {
      ...payload, // 包含 reason, sessionId
      senderId,
    });
  }
}
