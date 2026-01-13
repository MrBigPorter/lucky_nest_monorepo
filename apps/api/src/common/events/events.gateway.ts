import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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

  constructor(private readonly jwtService: JwtService) {}

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
}
