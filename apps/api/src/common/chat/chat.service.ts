import { Injectable } from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import {
  ChatMemberRole,
  CONVERSATION_TYPE,
  ConversationStatus,
} from '@lucky/shared';
import { ConversationListResponseDto } from '@api/common/chat/dto/conversation.response.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  // =================================================================
  // 🟢 核心查询 (消息列表页)
  // =================================================================
  async getConversationList(userId: string, page = 1, pageSize = 20) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        members: { some: { userId } },
        status: ConversationStatus.NORMAL,
      },
      include: {
        // 1. 查出"我"的设置 (置顶、未读数)
        members: {
          where: { userId },
          select: {
            isPinned: true,
            isMuted: true,
            lastReadSeqId: true,
            // unreadCount 不需要存库，前端根据 conv.lastMsgSeqId - member.lastReadSeqId 计算
          },
        },
        // 2. 关键优化：如果是私聊，必须查出对方的信息
        // 我们这里取前 2 个成员，如果是 DIRECT，排除自己就是对方
        // (Prisma 暂时很难在 include 里做复杂的条件过滤，所以建议把成员 User 信息简单带出来)
      },
      orderBy: { lastMsgTime: 'desc' }, // 暂时按时间，理想是按 members 的 isPinned 排序
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    //  后处理：为前端补充 Direct Chat 的头像和名字
    // 这一步虽然在 Service 做有点重，但能极大简化前端逻辑

    return await Promise.all(
      conversations.map(async (conv) => {
        let displayName = conv.name;
        let displayAvatar = conv['avatar']; // 假设 Schema 有 avatar 字段

        // 如果是私聊，且没有群名，则去查对方的信息
        if (conv.type === CONVERSATION_TYPE.DIRECT) {
          // 找对方 (成员里 userId 不等于我的那个)
          const partnerMember = await this.prisma.chatMember.findFirst({
            where: { conversationId: conv.id, userId: { not: userId } },
            include: { user: { select: { nickname: true, avatar: true } } },
          });

          if (partnerMember && partnerMember.user) {
            displayName = partnerMember.user.nickname;
            displayAvatar = partnerMember.user.avatar;
          }
        }
        const mySettings = conv.members[0];

        return new ConversationListResponseDto({
          id: conv.id,
          type: conv.type,
          name: displayName || 'Unknown',
          avatar: displayAvatar,
          lastMsgContent: conv.lastMsgContent,
          // 转时间戳，前端处理更方便
          lastMsgTime: conv.lastMsgTime ? conv.lastMsgTime.getTime() : 0,
          isPinned: mySettings?.isPinned ?? false,
          isMuted: mySettings?.isMuted ?? false,
          // 简单计算未读
          unreadCount: Math.max(
            0,
            conv.lastMsgSeqId - (mySettings?.lastReadSeqId ?? 0),
          ),
        });
      }),
    );
  }

  // =================================================================
  // 🔵 场景 A: 业务群 (拼团)
  // =================================================================
  async ensureBusinessConversation(businessId: string) {
    const existing = await this.prisma.conversation.findFirst({
      // 推荐用 findUnique 如果 businessId 是 unique
      where: { businessId },
    });

    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        //  建议用 BUSINESS 类型区分
        type: CONVERSATION_TYPE.BUSINESS, // 需确保 Enum 里有这个
        businessId,
        name: `Business Group ${businessId}`, // 占位名
        status: ConversationStatus.NORMAL,
        lastMsgContent: 'Welcome to the group!',
        lastMsgTime: new Date(),
      },
    });
  }

  // 添加成员到业务群
  async addMemberToBusinessGroup(businessId: string, userId: string) {
    const conversation = await this.ensureBusinessConversation(businessId);

    return this.prisma.chatMember.upsert({
      where: {
        conversationId_userId: {
          conversationId: conversation.id,
          userId,
        },
      },
      update: { role: ChatMemberRole.MEMBER },
      create: {
        conversationId: conversation.id,
        userId,
        role: ChatMemberRole.MEMBER,
      },
    });
  }

  // =================================================================
  // 🟡 场景 B: 私聊 (Direct)
  // =================================================================
  async ensureDirectConversation(myId: string, targetId: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: CONVERSATION_TYPE.DIRECT,
        AND: [
          { members: { some: { userId: myId } } },
          { members: { some: { userId: targetId } } },
        ],
      },
    });

    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        type: CONVERSATION_TYPE.DIRECT,
        status: ConversationStatus.NORMAL,
        members: {
          //  优化：使用 create 数组，兼容性更好
          create: [
            { userId: myId, role: ChatMemberRole.OWNER },
            { userId: targetId, role: ChatMemberRole.OWNER },
          ],
        },
      },
    });
  }

  // =================================================================
  // 🟣 场景 C: 手动建群 (Group)
  // =================================================================
  async createGroupChat(creatorId: string, name: string, memberIds: string[]) {
    const uniqueMembers = Array.from(new Set([creatorId, ...memberIds]));

    return this.prisma.conversation.create({
      data: {
        type: CONVERSATION_TYPE.GROUP,
        name,
        status: ConversationStatus.NORMAL,
        ownerId: creatorId, // 记录群主
        members: {
          //  优化：使用 create 数组
          create: uniqueMembers.map((uid) => ({
            userId: uid,
            role:
              uid === creatorId ? ChatMemberRole.OWNER : ChatMemberRole.MEMBER,
          })),
        },
      },
    });
  }

  // =================================================================
  // 🔌 辅助方法: 获取会话详情 (进房前/进房后调用)
  // =================================================================
  async getConversationDetail(conversationId: string, userId: string) {
    // 1. 权限校验
    const isMember = await this.prisma.chatMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!isMember) {
      throw new Error('Access denied: You are not a member of this chat');
    }

    // 2. 查会话 + 历史消息
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          take: 30, // 首屏加载 30 条
          orderBy: { seqId: 'desc' }, // 倒序查最新的
          include: {
            sender: { select: { id: true, nickname: true, avatar: true } },
          },
        },
      },
    });

    if (!conv) {
      throw new Error('Conversation not found');
    }

    // 3. 处理显示名称 (私聊显示对方名字)
    let displayName = conv.name;
    // let displayAvatar = conv.avatar; // 假设 Schema 有 avatar

    if (conv.type === CONVERSATION_TYPE.DIRECT) {
      const partnerMember = await this.prisma.chatMember.findFirst({
        where: { conversationId: conv.id, userId: { not: userId } },
        include: { user: { select: { nickname: true, avatar: true } } },
      });

      if (partnerMember && partnerMember.user) {
        displayName = partnerMember.user.nickname;
        // displayAvatar = partnerMember.user.avatar;
      }
    }

    // 4.  返回详情 DTO (包含 history)
    // 这里不再返回 ConversationListResponseDto，而是返回带 history 的结构
    return {
      id: conv.id,
      name: displayName || 'Unknown',
      type: conv.type,
      // 历史消息：需要转换一下格式，方便前端处理
      history: conv.messages
        .map((msg) => ({
          id: msg.id,
          content: msg.content,
          type: msg.type,
          createdAt: msg.createdAt.getTime(),
          sender: msg.sender
            ? {
                id: msg.sender.id,
                nickname: msg.sender.nickname,
                avatar: msg.sender.avatar,
              }
            : null,
          // 判断是不是自己发的，交给前端根据 myUserId 判断
        }))
        .reverse(), //  翻转回正序 (旧 -> 新)，方便前端 ListView 渲染
    };
  }
}
