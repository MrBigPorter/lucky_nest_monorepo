import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import {
  ChatMemberRole,
  CONVERSATION_TYPE,
  ConversationStatus,
} from '@lucky/shared';
import { ConversationListResponseDto } from '@api/common/chat/dto/conversation.response.dto';
import { SearchUserDto } from '@api/common/chat/dto/search-user.dto';
import { GetMessagesDto } from '@api/common/chat/dto/get-messages.dto';
import { EventsGateway } from '@api/common/events/events.gateway';
import { CreateMessageDto } from '@api/common/chat/dto/create-message.dto';
import { MarkAsReadDto } from '@api/common/chat/dto/mark-as-read.dto';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  // =================================================================
  // 🔴 核心操作 (发送消息)
  // =================================================================
  async sendMessage(userId: string, dto: CreateMessageDto) {
    const { conversationId, content, type } = dto;
    // 1. 存入数据库 (Prisma)
    // 使用事务处理 seqId 自增逻辑
    const message = await this.prisma.$transaction(async (tx) => {
      // A. 更新会话 SeqID
      const conv = await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMsgSeqId: { increment: 1 },
        },
        select: { lastMsgSeqId: true },
      });

      // B. 创建消息
      const msg = await tx.chatMessage.create({
        data: {
          conversationId,
          senderId: userId,
          content,
          type,
          seqId: conv.lastMsgSeqId,
          clientTempId: null, // HTTP 发送通常不需要回传这个，或者你可以加在 DTO 里传进来
        },
        include: {
          sender: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      });

      // C. 更新会话最后消息快照
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
    // 2. 通过 Gateway 广播给房间内其他人
    this.eventsGateway.server.to(conversationId).emit('chat_message', {
      ...message,
      isSelf: message.senderId === userId,
      createdAt: message.createdAt.getTime(), // 转时间戳
      tempId: dto.tempId, // 透传客户端临时 ID
    });
    return message;
  }

  // 核心操作: 消除红点 (标记已读)
  // =================================================================

  async markAsRead(userId: string, dto: MarkAsReadDto) {
    const { conversationId, maxSeqId } = dto;

    // 1. 查会话当前的最新 SeqId
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { lastMsgSeqId: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // 2. 确定要更新到的目标 SeqId
    // 如果前端传了 maxSeqId，就用前端传的（但不能超过会话实际最大值）
    // 如果没传，就直接拉满（全读）
    let targetSeqId = conversation.lastMsgSeqId;

    if (maxSeqId) {
      // 保护逻辑：不能标记读到了未来的消息
      targetSeqId = Math.min(maxSeqId, conversation.lastMsgSeqId);
    }

    // 3. 更新 Member 表
    const updatedMember = await this.prisma.chatMember.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadSeqId: targetSeqId,
      },
      select: { lastReadSeqId: true },
    });

    // 4. 计算剩余未读数 (理论上是 0，除非 maxSeqId 传小了，或者就在这一毫秒又来了新消息)
    const unreadCount = Math.max(
      0,
      conversation.lastMsgSeqId - updatedMember.lastReadSeqId,
    );

    // 5. (进阶) 如果做了多端同步，这里可以通过 Gateway 通知该用户的其他设备
    this.eventsGateway.server
      .to(`user_${userId}`)
      .emit('conversation_updated', {
        conversationId,
        lastReadSeqId: updatedMember.lastReadSeqId,
        unreadCount,
      });

    return {
      lastReadSeqId: updatedMember.lastReadSeqId,
      unreadCount: unreadCount,
    };
  }
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
  // 1. 获取详情
  async getConversationDetail(conversationId: string, userId: string) {
    // 鉴权：检查是否在群里
    const memberCheck = await this.prisma.chatMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!memberCheck)
      throw new ForbiddenException('you are not a member of this conversation');

    // 查数据
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            user: { select: { id: true, nickname: true, avatar: true } },
          },
        },
      },
    });

    if (!conv) throw new NotFoundException('conversation not found');

    // 处理显示名称
    let displayName = conv.name;
    let displayAvatar = conv['avatar']; // 假设有头像字段
    if (conv.type === 'DIRECT') {
      const partner = conv.members.find((m) => m.userId !== userId);
      if (partner) {
        displayName = partner.user.nickname;
        displayAvatar = partner.user.avatar;
      }
    }

    // 映射到 DTO
    return {
      id: conv.id,
      name: displayName || 'Unknown',
      avatar: displayAvatar,
      type: conv.type,
      memberCount: conv.members.length,
      members: conv.members.map((m) => ({
        userId: m.userId,
        nickname: m.user.nickname,
        avatar: m.user.avatar,
        role: m.role,
      })),
    };
  }

  // 2. 获取消息
  async getMessages(userId: string, dto: GetMessagesDto) {
    const { conversationId, cursor, pageSize = 20 } = dto;
    const takeAmount = pageSize + 1; // 多取一条用来判断是否有下一页

    // 查消息
    const messages = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { seqId: 'desc' }, // 最新的在前面
      take: takeAmount,
      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
      //修正1：如果有 cursor，必须 skip: 1 跳过自身，否则第一条会重复
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    // 判断是否有下一页
    let nextCursor: string | null = null;
    const hasNextPage = messages.length > pageSize;

    if (hasNextPage) {
      // 如果查到了多余的一条，说明有下一页
      // 1. 弹出多查的那一条（不要返给前端，那是下一页的数据）
      messages.pop();
      // 2. 将剩下的最后一条的 ID 设为游标
      nextCursor = messages[messages.length - 1].id;
    }
    // 在 cursor 模式下，total 其实没那么重要，可以不查以节省性能
    // 如果非要查 total，可以单独查，但对于无限滚动，通常不需要 total
    const mappedList = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      type: msg.type,
      createdAt: msg.createdAt.getTime(),
      isSelf: msg.senderId === userId,
      sender: {
        id: msg.sender?.id,
        nickname: msg.sender?.nickname,
        avatar: msg.sender?.avatar,
      },
    }));
    return {
      list: mappedList,
      nextCursor: nextCursor,
    };
  }

  // =======================================================
  // 🔍 搜索用户
  // =======================================================
  async searchUsers(myUserId: string, dto: SearchUserDto) {
    const { keyword } = dto;

    return this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: myUserId } }, // 排除自己
          {
            // 1. 昵称模糊搜索 (contains)
            OR: [
              { nickname: { contains: keyword, mode: 'insensitive' } },
              { phone: { contains: keyword } },
            ],
          },
        ],
      },
      take: 20, // 限制返回数量
      select: {
        id: true,
        nickname: true,
        avatar: true,
      },
    });
  }
}
