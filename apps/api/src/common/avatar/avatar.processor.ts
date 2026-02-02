import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { AvatarService } from './avatar.service';

import { EventsGateway } from '@api/common/events/events.gateway';
import { Logger } from '@nestjs/common';
import { SocketEvents } from '@lucky/shared';

// 定义队列名称常量
export const AVATAR_QUEUE_NAME = 'avatar_composition';

@Processor(AVATAR_QUEUE_NAME)
export class AvatarProcessor extends WorkerHost {
  private readonly logger = new Logger(AvatarProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly avatarService: AvatarService,
    private readonly eventsGateway: EventsGateway,
  ) {
    super(); // 必须调用 super
  }

  /**
   * 核心处理逻辑：根据 Job Name 进行分发
   */
  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.debug(`[Job Received] Name: ${job.name}`);
    switch (job.name) {
      case 'update_treasure_group':
        return this.handleTreasureGroup(job);
      case 'update_chat_group':
        return this.handleChatGroup(job);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  // ==========================================
  // 1. 处理夺宝团头像
  // ==========================================
  private async handleTreasureGroup(job: Job<{ groupId: string }>) {
    const { groupId } = job.data;

    const members = await this.prisma.treasureGroupMember.findMany({
      where: { groupId },
      take: 9,
      orderBy: { joinedAt: 'asc' },
      include: { user: { select: { avatar: true, nickname: true } } },
    });

    if (members.length === 0) return;

    const urls = members.map(
      (m) => m.user.avatar || this.getFallbackAvatar(m.user.nickname),
    );

    const newAvatarUrl = await this.avatarService.generateCompositeAvatar(
      urls,
      groupId,
    );

    if (newAvatarUrl) {
      await this.prisma.treasureGroup.update({
        where: { groupId },
        data: { groupAvatar: newAvatarUrl },
      });
    }
  }

  // ==========================================
  // 2. 处理群聊头像
  // ==========================================
  // ==========================================
  // 2. 处理群聊头像
  // ==========================================
  private async handleChatGroup(job: Job<{ conversationId: string }>) {
    const { conversationId } = job.data;

    // 1. 获取前 9 个成员（用于合成）
    // 2. [关键修改] 获取所有成员 ID（用于发送 Socket 通知）
    const allMembers = await this.prisma.chatMember.findMany({
      where: { conversationId },
      select: {
        userId: true,
        user: { select: { avatar: true, nickname: true } },
      },
    });

    if (allMembers.length === 0) return;

    // 之前的合成逻辑保持不变
    const urls = allMembers
      .slice(0, 9)
      .map((m) => m.user.avatar || this.getFallbackAvatar(m.user.nickname));

    const newAvatarUrl = await this.avatarService.generateCompositeAvatar(
      urls,
      conversationId,
    );

    if (newAvatarUrl) {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { avatar: newAvatarUrl },
      });

      if (!this.eventsGateway.server) {
        this.logger.error('❌ Socket server is not initialized!');
        return;
      }

      // 方案升级：多路精准推送
      this.logger.log(
        `📡 [Socket Broadcast] Group: ${conversationId}, Members: ${allMembers.length}`,
      );

      // A. 推送给正在房间里聊天的人
      this.eventsGateway.server
        .to(conversationId)
        .emit(SocketEvents.CONVERSATION_UPDATED, {
          id: conversationId,
          avatar: newAvatarUrl,
        });

      // B. 推送给所有群成员的“个人频道”（确保列表页刷新）
      for (const member of allMembers) {
        this.eventsGateway.server
          .to(`user_${member.userId}`)
          .emit(SocketEvents.CONVERSATION_UPDATED, {
            id: conversationId,
            avatar: newAvatarUrl,
          });
      }
    }
  }

  private getFallbackAvatar(name: string | null): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random`;
  }

  // 监控：任务完成
  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} of type ${job.name} completed.`);
  }

  // 监控：任务失败
  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}
