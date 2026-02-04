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
    this.logger.debug(`[FCM] Processing push for message: ${event.messageId}`);
    try {
      // 1. 获取预览文本
      const previewText = this._getPreviewText(event.type, event.content);

      // 2. 循环推送给其他成员
      for (const targetId of event.memberIds) {
        if (targetId === event.senderId) continue; // 不推给自己

        // TODO: 这里可以加缓存判断用户是否在线，若在线则不推 (高级优化)

        await this.notificationService.sendPrivateMessage(
          targetId,
          event.senderName, // 1. 这是系统通知栏显示的标题
          previewText, // 2. 这是系统通知栏显示的内容
          {
            type: 'chat',
            id: event.conversationId,

            title: event.senderName,
            body: previewText,

            click_action: 'FLUTTER_NOTIFICATION_CLICK',
          },
        );
      }
    } catch (e) {
      this.logger.error(`[FCM Push Error] ${e}`);
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
      default:
        return '[Message]';
    }
  }
}
