import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { AvatarService } from './avatar.service';
import { EventsGateway } from '@api/common/events/events.gateway';
import { Logger } from '@nestjs/common';
import { SocketEvents } from '@lucky/shared'; // 确保常量定义包含 CONVERSATION_UPDATED

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
    super();
  }

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

      // 注意：如果夺宝团也需要 Socket 通知，这里也应调用 dispatch
    }
  }

  private async handleChatGroup(job: Job<{ conversationId: string }>) {
    const { conversationId } = job.data;

    const allMembers = await this.prisma.chatMember.findMany({
      where: { conversationId },
      select: {
        userId: true,
        user: { select: { avatar: true, nickname: true } },
      },
    });

    if (allMembers.length === 0) return;

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

      this.logger.log(
        `📡 [Socket Broadcast] Group: ${conversationId}, Members: ${allMembers.length}`,
      );

      /**
       *  修改点 1: 修改房间内广播逻辑
       * 不再直接使用 emit，通过 dispatch 统一分发，适配前端 SocketDispatcherMixin
       */
      this.eventsGateway.dispatch(
        conversationId,
        SocketEvents.CONVERSATION_UPDATED,
        {
          id: conversationId,
          avatar: newAvatarUrl,
        },
      );

      /**
       *  修改点 2: 修改群成员个人频道广播逻辑
       * 遍历成员并使用 dispatch，确保即便用户不在当前聊天页面，也能在列表页刷新头像
       */
      for (const member of allMembers) {
        this.eventsGateway.dispatch(
          `user_${member.userId}`,
          SocketEvents.CONVERSATION_UPDATED,
          {
            id: conversationId,
            avatar: newAvatarUrl,
          },
        );
      }
    }
  }

  private getFallbackAvatar(name: string | null): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random`;
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} of type ${job.name} completed.`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}
