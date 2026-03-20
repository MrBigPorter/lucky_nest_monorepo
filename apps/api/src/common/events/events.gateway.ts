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
import type { Prisma } from '@prisma/client';

interface JwtPayloadLike {
  sub?: string;
}

const extractErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const getSocketUserId = (client: Socket): string | null => {
  const data = client.data as Record<string, unknown>;
  return typeof data.userId === 'string' ? data.userId : null;
};

const setSocketUserId = (client: Socket, userId: string): void => {
  const data = client.data as Record<string, unknown>;
  data.userId = userId;
};

const isConversationSeqRows = (
  value: unknown,
): value is Array<{ lastMsgSeqId: number }> =>
  Array.isArray(value) &&
  value.every((item) => {
    if (typeof item !== 'object' || item === null) {
      return false;
    }

    const row = item as Record<string, unknown>;
    return typeof row.lastMsgSeqId === 'number';
  });

export enum SocketRoom {
  LOBBY = 'group_lobby', // 拼团大厅
}

// 定义推送子类型
export enum PushEventType {
  GROUP_SUCCESS = 'group_success',
  GROUP_FAILED = 'group_failed',
}
@WebSocketGateway()
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
        (typeof client.handshake.query.token === 'string'
          ? client.handshake.query.token
          : undefined) ||
        (typeof client.handshake.auth?.token === 'string'
          ? client.handshake.auth.token
          : undefined);

      let userId: string | null = null;
      if (token) {
        // Try client JWT secret first, then admin JWT secret
        const secrets = [
          process.env.JWT_SECRET || 'please_change_me_very_secret',
          process.env.ADMIN_JWT_SECRET,
        ].filter(Boolean) as string[];

        for (const secret of secrets) {
          try {
            const payload = this.jwtService.verify<JwtPayloadLike>(token, {
              secret,
            });
            userId = typeof payload.sub === 'string' ? payload.sub : null;
            this.logger.debug(` User verified via JWT: ${userId}`);
            break;
          } catch {
            // try next secret
          }
        }

        if (userId) {
          const privateRoom = `user_${userId}`;
          await client.join(privateRoom);
          setSocketUserId(client, userId);
          this.logger.log(
            `🔌 Client connected: ${client.id} (User: ${userId})`,
          );
        }
      }
    } catch (error: unknown) {
      this.logger.error(`Connection error: ${extractErrorMessage(error)}`);
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
  dispatch(room: string, type: string, data: unknown, excludeRoom?: string) {
    if (excludeRoom) {
      this.server
        .to(room)
        .except(excludeRoom) // 排除特定房间（如已在房间内的人）
        .emit(SocketEvents.DISPATCH, {
          type, // 对应前端的业务识别码，如 'chat_message'
          data, // 实际数据载荷z
        });
    } else {
      this.server.to(room).emit(SocketEvents.DISPATCH, {
        type, // 对应前端的业务识别码，如 'chat_message'
        data, // 实际数据载荷
      });
    }

    this.logger.debug(` [Dispatch] To: ${room}, Type: ${type}`);
  }

  // ---------------------------------------------------------
  // 业务通知逻辑 (重构为调用 dispatch)
  // ---------------------------------------------------------

  /**
   *  修改点 2: 修改大厅广播逻辑
   */
  broadcastToLobby(payload: unknown) {
    // 统一走 dispatch 出口，类型设为 GROUP_UPDATE
    this.dispatch(SocketRoom.LOBBY, SocketEvents.GROUP_UPDATE, payload);
  }

  /**
   *  修改点 3: 修改个人私信通知逻辑
   */
  notifyUser(userId: string, type: string, payload: unknown) {
    const privateRoom = `user_${userId}`;
    this.dispatch(privateRoom, type, payload);
  }

  /**
   * 精准分发：发给特定用户 (通过私有房间)
   * 这就是你问的 dispatchToUser 的来源
   */
  dispatchToUser(userId: string, type: string, data: unknown) {
    const privateRoom = `user_${userId}`;
    // 直接复用 dispatch 逻辑，发送到该用户的私有房间
    this.dispatch(privateRoom, type, data);
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
    void client.join(payload.conversationId);
    return { status: 'joined', conversationId: payload.conversationId };
  }

  @SubscribeMessage(SocketEvents.LEAVE_CHAT)
  handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    void client.leave(payload.conversationId);
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
    const userId = getSocketUserId(client);
    if (!userId) return { error: 'Unauthorized' };

    const { conversationId, content, type, tempId } = payload;

    try {
      const result = await this.prismaService.$transaction(
        async (tx: Prisma.TransactionClient) => {
          await tx.conversation.updateMany({
            where: { id: conversationId },
            data: { lastMsgSeqId: { increment: 1 } },
          });

          const conversationRowsUnknown =
            await (tx.$queryRaw`SELECT "lastMsgSeqId" FROM "Conversation" WHERE "id" = ${conversationId} LIMIT 1` as Promise<unknown>);
          const seqId = isConversationSeqRows(conversationRowsUnknown)
            ? (conversationRowsUnknown[0]?.lastMsgSeqId ?? 0)
            : 0;

          const msg = await tx.chatMessage.create({
            data: {
              conversationId,
              senderId: userId,
              content,
              type,
              seqId,
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
        },
      );

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
    } catch (error: unknown) {
      const message = extractErrorMessage(error);
      this.logger.error(`Send Message Failed: ${message}`);
      return { status: 'error', message };
    }
  }

  @SubscribeMessage('join_lobby')
  handleJoinLobby(@ConnectedSocket() client: Socket) {
    void client.join(SocketRoom.LOBBY);
  }

  @SubscribeMessage('leave_lobby')
  handleLeaveLobby(@ConnectedSocket() client: Socket) {
    void client.leave(SocketRoom.LOBBY);
  }
}
