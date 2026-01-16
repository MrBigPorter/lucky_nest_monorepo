import { Injectable } from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { ConversationType } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  // 1. 获取或创建会话 (幂等操作)
  // 场景：开团时调用
  async findOrCreateConversation(params: {
    type: ConversationType;
    businessId: string; // 业务ID，例如团ID
    creatorId?: string; // 创建者ID
  }) {
    // 尝试查找已有会话
    const existing = await this.prisma.conversation.findFirst({
      where: { businessId: params.businessId },
    });
    if (existing) {
      return existing;
    }
    // 创建新会话
    return this.prisma.conversation.create({
      data: {
        type: params.type,
        businessId: params.businessId,
      },
    });
  }

  // 2. 添加成员 (幂等操作)
  // 场景：参团支付成功后调用
  async addMember(businessId: string, userId: string) {
    // 查找会话
    const conversation = await this.prisma.conversation.findUnique({
      where: { businessId },
    });
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // upsert 成员: 存在则不变，不存在则创建
    return this.prisma.chatMember.upsert({
      where: {
        conversationId_userId: {
          conversationId: conversation.id,
          userId,
        },
      },
      create: {
        conversationId: conversation.id,
        userId,
      },
      update: {}, // 不做任何更新
    });
  }

  // 3. 供前端调用的：获取会话信息
  // 场景：进入 GroupRoomPage 时调用
  async getChatInfo(businessId: string, userId: string) {
    // 查找会话
    const conversation = await this.prisma.conversation.findUnique({
      where: { businessId },
      include: {
        //只取最近20消息
        messages: {
          take: 20,
          orderBy: {
            seqId: 'desc',
          },
        },
      },
    });

    if (!conversation) return null; //未找到会话

    // 可以在这里检查 userId 是否在 members 里，做权限校验

    return {
      conversationId: conversation.id,
      lastMsgSeqId: conversation.lastMsgSeqId,
      history: conversation.messages.reverse(), // 反转回正序
    };
  }
}
