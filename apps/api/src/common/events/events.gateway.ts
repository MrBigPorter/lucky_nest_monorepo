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
export enum SocketRoom {
  LOBBY = 'group_lobby', // 拼团大厅
}

// 1. 新增：定义所有推送类型，防止手抖写错
export enum PushEventType {
  GROUP_UPDATE = 'group_update', // 大厅：进度更新
  GROUP_SUCCESS = 'group_success', // 私信：拼团成功
  GROUP_FAILED = 'group_failed', // 私信：拼团失败(退款)
  WALLET_CHANGE = 'wallet_change', // 私信：余额变动
}

@WebSocketGateway({
  namespace: 'events',
  cors: { origin: '*' }, // 允许跨域
  // 心跳配置：后端也需要配置，配合前端检测假死
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

  // 客户端发送 "joinRoom" 消息，加入指定房间
  // 2. 修改：连接时识别用户身份，加入私人房间
  async handleConnection(client: Socket) {
    try {
      // 从连接参数中获取 token 或 userId
      // Flutter 端: IO.io(..., OptionBuilder().setQuery({'token': 'xxx'}).build())
      const token =
        (client.handshake.query.token as string) ||
        (client.handshake.auth?.token as string);

      // 简单解析 token 获取 userId (生产环境建议调用 AuthService 验证)
      let userId: string | null = null;
      if (token) {
        try {
          //  2. 使用 JwtService 验证并解析
          // 这会自动使用 AuthModule 里配置的 Secret 校验签名
          const payload = this.jwtService.verify(token);
          userId = payload.sub; // 假设 JWT 里用 sub 存用户 ID

          this.logger.debug(`🔐 User verified via JWT: ${userId}`);
        } catch (jwtError: any) {
          this.logger.warn(`❌ JWT Verification Error: ${jwtError.message}`);
        }

        this.logger.log(
          `🔌 Client connected: ${client.id} (User: ${userId || 'Guest'})`,
        );

        // 如果验证通过，加入私人房间
        if (userId) {
          const privateRoom = `user_${userId}`;
          await client.join(privateRoom);
          this.logger.log(
            `Client ${client.id} joined private room: ${privateRoom}`,
          );
          // 可选：把 userId 挂在 Socket 实例上，以后在这个连接发消息不需要再查了
          (client as any).userId = userId;
        }
      }
    } catch (error: any) {
      this.logger.error(`Connection error: ${error.message}`);
    }
  }

  // 客户端断开连接
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // 客户端请求加入拼团大厅房间
  @SubscribeMessage('join_lobby')
  handleJoinLobby(@ConnectedSocket() client: Socket) {
    client.join(SocketRoom.LOBBY);
    this.logger.log(`Client ${client.id} joined room: ${SocketRoom.LOBBY}`);
  }

  // 客户端请求离开拼团大厅房间
  @SubscribeMessage('leave_lobby')
  handleLeaveLobby(@ConnectedSocket() client: Socket) {
    client.leave(SocketRoom.LOBBY);
    this.logger.log(`Client ${client.id} left room: ${SocketRoom.LOBBY}`);
  }

  /**
   * 场景 A: 广播给大厅 (更新进度)
   * 替换原来的 broadcastToLobby
   */
  broadcastToLobby(payload: any) {
    // 内部调用 sendPush，类型固定为 GROUP_UPDATE
    this.sendPush(SocketRoom.LOBBY, PushEventType.GROUP_UPDATE, payload);
  }

  /**
   * 场景 B: 私信通知用户 (成功/失败/退款)
   * 给 GroupService 调用的
   */
  notifyUser(userId: string, type: PushEventType, payload: any) {
    const privateRoom = `user_${userId}`;
    this.sendPush(privateRoom, type, payload);
  }

  // =========================================================
  //  核心修改：统一发送方法 (Send Push)
  // =========================================================

  /**
   * 通用推送方法：所有消息都走这个出口
   * 前端只需要监听 'server_push'
   */
  private sendPush(room: string, type: PushEventType, payload: any) {
    const message = {
      type, // 告诉前端是什么事
      payload: payload, // 具体数据
      timestamp: Date.now(), // 方便前端做防抖或排序
    };

    // 统一事件
    this.server.to(room).emit('server_push', message);
    this.logger.log(
      `📨 [Gateway] Sent push to room '${room}': ${JSON.stringify(message)}`,
    );
  }

  // =========================================================
  //   新增业务：IM 聊天核心逻辑 (兼容扩展)
  // =========================================================

  /**
   * 1. 加入聊天室
   * 前端调用: socket.emit('join_chat', { conversationId: 'xxx' })
   */
  @SubscribeMessage('join_chat')
  handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    const { conversationId } = payload;
    // 简单校验一下，防止加入空房间
    if (!conversationId) return;

    client.join(conversationId);
    this.logger.log(
      `💬 Client ${client.id} joined Chat Room: ${conversationId}`,
    );
    return { status: 'joined', conversationId };
  }

  /**
   * 2. 离开聊天室
   */
  @SubscribeMessage('leave_chat')
  handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    client.leave(payload.conversationId);
  }

  /**
   * 3. 发送消息 (核心!)
   * 前端调用: socket.emit('send_message', { ... })
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      conversationId: string;
      content: string;
      type: number;
      tempId: string; // 前端生成的 UUID
    },
  ) {
    // 从 handleConnection 挂载的属性里拿 userId，更安全
    const userId = (client as any).userId;
    if (!userId) {
      this.logger.warn(`❌ Unauthorized message attempt from ${client.id}`);
      return { error: 'Unauthorized' };
    }

    const { conversationId, content, type, tempId } = payload;

    try {
      //  事务：SeqID自增 + 存消息 + 更新会话快照
      // (这里逻辑和之前规划的一样，为了保持 Gateway 干净，
      const result = await this.prismaService.$transaction(async (tx) => {
        // A. 自增 SeqID
        const conv = await tx.conversation.update({
          where: { id: conversationId },
          data: {
            lastMsgSeqId: { increment: 1 },
          },
          select: { lastMsgSeqId: true },
        });
        const nextSeqId = conv.lastMsgSeqId;

        // B. 存消息
        const msg = await tx.chatMessage.create({
          data: {
            conversationId,
            senderId: userId,
            content,
            type,
            seqId: nextSeqId,
            clientTempId: tempId,
          },
          include: {
            sender: true, // 把发送者头像昵称带出来，方便广播
          },
        });
        // C. 更新会话快照
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

      //  广播给房间内其他人 (使用独立事件名 'chat_message')
      // 注意：使用 broadcast.to() 或者 client.to() 可以排除自己
      // 但为了保证多端同步(比如我在手机发了，网页端也要显示)，通常直接 server.to()
      client.to(conversationId).emit('chat_message', result);

      //  返回 ACK (给当前客户端)
      // Socket.io 会自动把这个 return 值作为回调传给前端的 emit ack function
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
}
