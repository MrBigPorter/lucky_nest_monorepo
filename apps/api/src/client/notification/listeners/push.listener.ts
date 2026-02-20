import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../notification.service';
import {
  CHAT_EVENTS,
  MessageCreatedEvent,
} from '@api/common/chat/events/chat.events';
import { MESSAGE_TYPE } from '@lucky/shared';

@Injectable()
export class PushListener {
  private readonly logger = new Logger(PushListener.name);

  constructor(private readonly notificationService: NotificationService) {}

  //  异步执行：不阻塞主线程发消息
  @OnEvent(CHAT_EVENTS.MESSAGE_CREATED, { async: true })
  async handleFcmPush(event: MessageCreatedEvent) {
    // 1. 熔断检查：如果 memberIds 为空 (说明是大群，或者单聊)，直接跳过
    // 这是配合 ChatGroupService 大群熔断机制的关键
    if (!event.memberIds || event.memberIds.length === 0) {
      // 可以在这里打个 debug 日志，确认大群熔断生效
      this.logger.debug(
        `[FCM] Skip push for empty member list (Large Group or Private): ${event.conversationId}`,
      );
      return;
    }

    this.logger.debug(`[FCM] Processing push for message: ${event.messageId}`);

    try {
      // 1. 获取预览文本
      const previewText = this._getPreviewText(event.type, event.content);

      // 3.  性能优化：将“串行等待”改为“并发执行”
      // 使用 Promise.allSettled 防止某一个人发送失败导致整个流程报错中断
      const pushPromises = event.memberIds.map(async (targetId) => {
        if (targetId === event.senderId) return; // 不推给自己

        // TODO: 这里可以加 Redis 在线状态判断 (Online ? Skip : Push)

        return this.notificationService.sendPrivateMessage(
          targetId,
          event.senderName,
          previewText,
          {
            type: 'chat',
            id: event.conversationId,
            title: event.senderName,
            body: previewText,
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
          },
        );
      });

      // 并发等待所有请求完成 (几百人也就是几百毫秒的事)
      await Promise.allSettled(pushPromises);
    } catch (e) {
      this.logger.error(`[FCM Push Error] ${e}`);
    }
  }

  @OnEvent('call.wake_up', { async: true })
  async handleCallWakeUp(event: {
    targetId: string;
    sessionId: string;
    senderId: string;
    mediaType: string;
  }) {
    this.logger.debug(
      `[FCM] Processing call wake up for target: ${event.targetId}`,
    );
    try {
      // 调用 NotificationService 专属的唤醒方法
      await this.notificationService.sendCallWakeUpPush(event.targetId, event);
    } catch (e) {
      this.logger.error(`[FCM Call WakeUp Error] ${e}`);
    }
  }

  // 简单的预览文本生成器 (可以提取为 Shared Util)
  private _getPreviewText(type: number, content: string): string {
    switch (type) {
      case MESSAGE_TYPE.TEXT:
        return content;
      case MESSAGE_TYPE.IMAGE:
        return '[Image]';
      case MESSAGE_TYPE.AUDIO:
        return '[Voice]';
      case MESSAGE_TYPE.VIDEO:
        return '[Video]';
      case MESSAGE_TYPE.FILE:
        return '[File]';
      case MESSAGE_TYPE.LOCATION:
        return '[Location]';
      case 99: //  适配系统消息
        return `[System] ${content}`;
      default:
        return '[Message]';
    }
  }
}
