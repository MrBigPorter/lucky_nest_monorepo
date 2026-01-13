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
export enum SocketRoom {
  LOBBY = 'group_lobby', // 拼团大厅
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

  // 客户端发送 "joinRoom" 消息，加入指定房间
  handleConnection(client: Socket) {
    // 实际项目中，这里要解析 client.handshake.auth.token 验证身份
    this.logger.log(`Client connected: ${client.id}`);
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
   * 广播消息到拼团大厅房间的所有客户端
   * @param event
   * @param payload
   */
  broadcastToLobby(event: string, payload: any) {
    // 1. 保留这行日志，证明数据到了这里
    this.logger.log(
      `📡 [Gateway] Broadcasting '${event}' to room '${SocketRoom.LOBBY}'. Data: ${JSON.stringify(payload)}`,
    );

    //  删除下面这行！就是它导致了报错崩溃
    // const roomSize = this.server.sockets.adapter.rooms.get(SocketRoom.LOBBY)?.size || 0;
    // this.logger.log(`👥 [Gateway] Room '${SocketRoom.LOBBY}' has ${roomSize} clients.`);

    //  2. 直接发送！
    this.server.to(SocketRoom.LOBBY).emit(event, payload);
  }
}
