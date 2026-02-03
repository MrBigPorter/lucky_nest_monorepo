import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { SocketEvents } from '@lucky/shared';

export enum SocketRoom {
  LOBBY = 'group_lobby', // 拼团大厅
}

// 定义推送子类型
export enum PushEventType {
  GROUP_UPDATE = 'group_update',
  GROUP_SUCCESS = 'group_success',
  GROUP_FAILED = 'group_failed',
  WALLET_CHANGE = 'wallet_change',
}

@WebSocketGateway({
  namespace: 'events',
  cors: { origin: '*' },
  pingInterval: 10000,
  pingTimeout: 5000,
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.query.token as string) ||
        (client.handshake.auth?.token as string);

      let userId: string | null = null;
      if (token) {
        try {
          const payload = this.jwtService.verify(token);
          userId = payload.sub;
          this.logger.debug(` User verified via JWT: ${userId}`);
        } catch (jwtError: any) {
          this.logger.warn(` JWT Verification Error: ${jwtError.message}`);
        }

        if (userId) {
          const privateRoom = `user_${userId}`;
          await client.join(privateRoom);
          (client as any).userId = userId;
          this.logger.log(
            `🔌 Client connected: ${client.id} (User: ${userId})`,
          );
        }
      }
    } catch (error: any) {
      this.logger.error(`Connection error: ${error.message}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ---------------------------------------------------------
  // 核心：统一分发方法 (Unified Dispatcher)
  // ---------------------------------------------------------

  /**
   *  修改点 1: 增加统一分发出口
   * 所有业务指令的最终出口，前端只监听 SocketEvents.DISPATCH ('dispatch')
   */
  dispatch(room: string, type: string, data: any) {
    this.server.to(room).emit(SocketEvents.DISPATCH, {
      type, // 对应前端的业务识别码，如 'chat_message'
      data, // 实际数据载荷
    });
    this.logger.debug(` [Dispatch] To: ${room}, Type: ${type}`);
  }

  // ---------------------------------------------------------
  // 业务通知逻辑 (重构为调用 dispatch)
  // ---------------------------------------------------------

  /**
   *  修改点 2: 修改大厅广播逻辑
   */
  broadcastToLobby(payload: any) {
    // 统一走 dispatch 出口，类型设为 GROUP_UPDATE
    this.dispatch(SocketRoom.LOBBY, SocketEvents.GROUP_UPDATE, payload);
  }

  /**
   *  修改点 3: 修改个人私信通知逻辑
   */
  notifyUser(userId: string, type: string, payload: any) {
    const privateRoom = `user_${userId}`;
    this.dispatch(privateRoom, type, payload);
  }

  /**
   *  修改点 4: 兼容旧 sendPush 方法，内部重定向至 dispatch
   */
  private sendPush(room: string, type: string, payload: any) {
    this.dispatch(room, type, payload);
  }

  // ---------------------------------------------------------
  // IM 聊天监听逻辑
  // ---------------------------------------------------------

  @SubscribeMessage(SocketEvents.JOIN_CHAT)
  handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    if (!payload.conversationId) return;
    client.join(payload.conversationId);
    return { status: 'joined', conversationId: payload.conversationId };
  }

  @SubscribeMessage(SocketEvents.LEAVE_CHAT)
  handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    client.leave(payload.conversationId);
  }

  @SubscribeMessage(SocketEvents.SEND_MESSAGE)
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      conversationId: string;
      content: string;
      type: number;
      tempId: string;
    },
  ) {
    const userId = (client as any).userId;
    if (!userId) return { error: 'Unauthorized' };

    const { conversationId, content, type, tempId } = payload;

    try {
      const result = await this.prismaService.$transaction(async (tx) => {
        const conv = await tx.conversation.update({
          where: { id: conversationId },
          data: { lastMsgSeqId: { increment: 1 } },
          select: { lastMsgSeqId: true },
        });

        const msg = await tx.chatMessage.create({
          data: {
            conversationId,
            senderId: userId,
            content,
            type,
            seqId: conv.lastMsgSeqId,
            clientTempId: tempId,
          },
          include: { sender: true },
        });

        await tx.conversation.update({
          where: { id: conversationId },
          data: {
            lastMsgContent: type === 0 ? content : '[Media]',
            lastMsgType: type,
            lastMsgTime: new Date(),
          },
        });
        return msg;
      });

      /**
       *  修改点 5: 修改发送消息后的广播逻辑
       * 不再直接 emit(chat_message)，而是通过 dispatch 分发
       */
      this.dispatch(conversationId, SocketEvents.CHAT_MESSAGE, {
        ...result,
        isSelf: false, // 告知房间内其他人此消息非本人发送
      });

      return {
        status: 'ok',
        data: {
          id: result.id,
          seqId: result.seqId,
          tempId: tempId,
          createdAt: result.createdAt,
        },
      };
    } catch (error: any) {
      this.logger.error(`Send Message Failed: ${error.message}`);
      return { status: 'error', message: error.message };
    }
  }

  @SubscribeMessage('join_lobby')
  handleJoinLobby(@ConnectedSocket() client: Socket) {
    client.join(SocketRoom.LOBBY);
  }

  @SubscribeMessage('leave_lobby')
  handleLeaveLobby(@ConnectedSocket() client: Socket) {
    client.leave(SocketRoom.LOBBY);
  }
}
