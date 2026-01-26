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
  MESSAGE_TYPE,
  SocketEvents,
  TimeHelper,
} from '@lucky/shared';
import { ConversationListResponseDto } from '@api/common/chat/dto/conversation.response.dto';
import { SearchUserDto } from '@api/common/chat/dto/search-user.dto';
import { GetMessagesDto } from '@api/common/chat/dto/get-messages.dto';
import { EventsGateway } from '@api/common/events/events.gateway';
import { CreateMessageDto } from '@api/common/chat/dto/create-message.dto';
import { MarkAsReadDto } from '@api/common/chat/dto/mark-as-read.dto';
import { DeleteMessageDto } from '@api/common/chat/dto/delete-message.dto';
import { CreateGroupChatDto } from '@api/common/chat/dto/create-group-chat.dto';
import { CreateGroupDto } from '@api/common/chat/dto/group-chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  // =================================================================
  //  核心操作 (发送消息)
  // =================================================================
  async sendMessage(userId: string, dto: CreateMessageDto) {
    const { id, conversationId, content, type, duration, width, height } = dto;

    // 2. 幂等性检查 (Idempotency Check)
    // 如果该 ID 已存在，直接返回，不做任何处理。
    // 这解决了前端因网络超时重试导致的“重复消息”问题。
    const existingMessage = await this.prisma.chatMessage.findUnique({
      where: { id },
    });
    if (existingMessage) {
      // 可以在这里做一个简单的校验，确保 senderId 一致，防止恶意覆盖
      if (existingMessage.senderId !== userId) {
        throw new ForbiddenException('Message ID conflict');
      }
      return {
        ...existingMessage,
        createdAt: existingMessage.createdAt.getTime(),
        isSelf: true, // 明确告诉前端这是自己发的
      };
    }

    // 3. 组装 Meta (丰富元数据)
    // 使用具体的接口类型代替 any，代码更健壮
    const meta: Record<string, any> = {};

    // 如果是语音 (type 2) 且传了 duration，存入 meta
    if (dto.type === MESSAGE_TYPE.AUDIO && dto.duration) {
      meta.duration = dto.duration;
    }

    //  建议：把宽高存入 meta，解决图片气泡闪烁问题
    if (
      (type === MESSAGE_TYPE.IMAGE || type === MESSAGE_TYPE.VIDEO) &&
      width &&
      height
    ) {
      meta.w = width;
      meta.h = height;
    }

    // 1. 存入数据库 (Prisma)
    // 使用事务处理 seqId 自增逻辑
    const message = await this.prisma.$transaction(async (tx) => {
      // A. 锁定并更新会话 SeqID
      // 注意：在高并发群聊中，这里可能会成为热点。
      // 如果未来量大，可以考虑使用 Redis 自增 seqId，异步写入 DB。

      const conv = await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMsgSeqId: { increment: 1 },
          lastMsgContent: this._getPreviewText(type, content), // 抽离方法
          lastMsgType: type,
          lastMsgTime: new Date(),
        },
        select: { lastMsgSeqId: true },
      });

      // B. 创建消息
      const msg = await tx.chatMessage.create({
        data: {
          id, // 使用前端传的 ID
          conversationId,
          senderId: userId,
          content,
          type,
          //  核心：把 duration 存进 meta 字段
          meta: Object.keys(meta).length > 0 ? meta : undefined,
          seqId: conv.lastMsgSeqId,
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

      //  核心修复：在发送时，自动更新【发送者】的 lastReadSeqId
      await tx.chatMember.updateMany({
        where: {
          conversationId,
          userId,
        },
        data: {
          lastReadSeqId: conv.lastMsgSeqId, // 标记为已读到最新
        },
      });

      // C. 更新会话最后消息快照
      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMsgContent: this._getPreviewText(type, content),
          lastMsgType: type,
          lastMsgTime: new Date(),
        },
      });

      return msg;
    });

    // 2. 构造统一的返回对象 (DTO)
    const messageDto = {
      ...message,
      createdAt: message.createdAt.getTime(), // 转时间戳
      isRecalled: false,
    };

    // 2. 通过 Gateway 广播给房间内其他人
    this.eventsGateway.server
      .to(conversationId)
      .emit(SocketEvents.CHAT_MESSAGE, {
        ...messageDto,
        isSelf: undefined,
      });

    // 2. 【新增逻辑】推给所有成员的“个人专属房间”
    const members = await this.prisma.chatMember.findMany({
      where: {
        conversationId,
        userId: { not: userId }, // 排除发送者自己
      },
      select: { userId: true },
    });

    members.forEach((member) => {
      //  关键修正：必须加上 "user_" 前缀，以此匹配 Gateway 里的 handleConnection 逻辑
      const privateRoom = `user_${member.userId}`;

      this.eventsGateway.server
        .to(privateRoom)
        .emit(SocketEvents.CHAT_MESSAGE, {
          ...messageDto,
          isSelf: false,
        });
    });

    // fcm send notification
    return {
      ...messageDto,
      isSelf: true, //  明确告诉前端，这是我自己发的
    };
  }

  // 核心操作: 消除红点 (标记已读)
  // =================================================================

  // =================================================================
  //  核心操作 (撤回消息)
  // =================================================================
  async recallMessage(userId: string, messageId: string) {
    // 1. 查消息，确认存在且是自己发的
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only recall your own messages');
    }

    // 3. 时间校验：严格 2 分钟限制 (120,000 毫秒)
    const isWithinTwoMinus = TimeHelper.isWithinRange(
      message.createdAt,
      new Date(),
      120000,
    );
    if (!isWithinTwoMinus) {
      throw new ForbiddenException('Recall time window has expired');
    }

    // 4. 执行撤回事务
    const updatedMessage = await this.prisma.$transaction(async (tx) => {
      // A. 逻辑修改消息内容和类型
      const msg = await tx.chatMessage.update({
        where: { id: messageId },
        data: {
          content: '[Message Recalled]',
          type: MESSAGE_TYPE.RECALLED, // 假设有个 RECALLED 类型
          meta: {}, // 清空 meta
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

      // B. 更新会话快照 (如果撤回的是最后一条消息，则需要更新会话的 lastMsgContent 等字段)
      const conv = await tx.conversation.findUnique({
        where: { id: msg.conversationId },
        select: {
          lastMsgSeqId: true,
        },
      });

      if (conv && conv.lastMsgSeqId === msg.seqId) {
        // 撤回的是最后一条消息，更新会话快照
        await tx.conversation.update({
          where: { id: msg.conversationId },
          data: {
            lastMsgContent: '[Message Recalled]',
            lastMsgType: MESSAGE_TYPE.RECALLED,
          },
        });
      }

      return {
        messageId: msg.id,
        tip: 'Message has been recalled',
      };
    });

    // 5. 广播撤回事件
    this.eventsGateway.server
      .to(message.conversationId)
      .emit(SocketEvents.MESSAGE_RECALLED, {
        conversationId: message.conversationId,
        isSelf: message.senderId === userId,
        messageId: messageId,
        operatorId: userId,
        seqId: message.seqId,
        tip: 'An image or text has been recalled', // 供前端 fallback 显示
      });

    return updatedMessage;
  }

  // =================================================================
  //  核心操作 (删除消息)
  // =================================================================
  async deleteMessage(userId: string, dto: DeleteMessageDto) {
    const { messageId, conversationId } = dto;

    // 1.check message exists
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { senderId: true, conversationId: true },
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // 2.  严谨性校验：校验用户是否是该会话的成员
    // 只有会话成员才有权隐藏该会话的消息
    const member = await this.prisma.chatMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: message.conversationId,
          userId,
        },
      },
    });
    if (!member) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    // 2. 幂等插入隐藏记录
    // 使用 upsert 即使前端并发重复请求，数据库也不会报唯一索引冲突
    await this.prisma.chatMessageHide.upsert({
      where: {
        userId_messageId: { userId, messageId },
      },
      update: {}, // 已存在则不做任何操作
      create: { userId, messageId },
    });
    return { messageId };
  }

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

    //  架构师操作：Event Sourcing (事件广播)
    // 告诉房间里的其他人："我(userId) 已经读到了 targetSeqId 这一行"
    // ==========================================================
    this.eventsGateway.server
      .to(conversationId)
      .emit(SocketEvents.CONVERSATION_READ, {
        readerId: userId,
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
  //  核心查询 (消息列表页)
  // =================================================================
  async getConversationList(userId: string, page = 1, pageSize = 200) {
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

    // 2.  解决 N+1 问题：收集所有 Direct Chat 的 ID
    const directConvIds = conversations
      .filter((conv) => conv.type === CONVERSATION_TYPE.DIRECT)
      .map((conv) => conv.id);

    // 3. ️ 批量查询对方信息 (只查 Direct 类型且不是自己的成员)
    let partnersMap = new Map<
      string,
      { nickname: string | null; avatar: string | null }
    >();

    if (directConvIds.length > 0) {
      const partners = await this.prisma.chatMember.findMany({
        where: {
          conversationId: { in: directConvIds },
          userId: { not: userId }, // 排除自己
        },
        include: {
          user: { select: { nickname: true, avatar: true } },
        },
      });

      // 转为 Map: conversationId -> UserInfo
      partners.forEach((p) => {
        if (p.user) partnersMap.set(p.conversationId, p.user);
      });
    }
    // 4. 内存组装数据
    return conversations.map((conv) => {
      let displayName = conv.name;
      let displayAvatar = conv['avatar']; // Schema 中若无 avatar 字段，需确认

      // 如果是私聊，从 Map 中取对方信息
      if (conv.type === CONVERSATION_TYPE.DIRECT) {
        const partner = partnersMap.get(conv.id);
        if (partner) {
          displayName = partner.nickname;
          displayAvatar = partner.avatar;
        }
      }

      const mySettings = conv.members[0]; // 前面 include where userId 保证了只有 1 个

      return new ConversationListResponseDto({
        id: conv.id,
        type: conv.type,
        name: displayName || 'Unknown',
        avatar: displayAvatar,
        lastMsgContent: conv.lastMsgContent,
        lastMsgTime: conv.lastMsgTime ? conv.lastMsgTime.getTime() : 0,
        isPinned: mySettings?.isPinned ?? false,
        isMuted: mySettings?.isMuted ?? false,
        unreadCount: Math.max(
          0,
          conv.lastMsgSeqId - (mySettings?.lastReadSeqId ?? 0),
        ),
      });
    });
  }

  // =================================================================
  //  场景 A: 业务群 (拼团)
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
  //  场景 B: 私聊 (Direct)
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

  /**
   * 功能：邀请成员加入群聊
   * 逻辑：过滤已在群里的人 -> 批量插入 Member 表
   */
  async inviteToGroup(
    operatorId: string,
    dto: { groupId: string; memberIds: string[] },
  ) {
    const { groupId, memberIds } = dto;
    // 1. 鉴权：操作人必须在群里
    const operator = await this.prisma.chatMember.findUnique({
      where: {
        conversationId_userId: { conversationId: groupId, userId: operatorId },
      },
    });
    if (!operator) {
      throw new ForbiddenException('You are not a member of this group');
    }

    // 2. 查重：找出已经在群里的人
    const existingMembers = await this.prisma.chatMember.findMany({
      where: {
        conversationId: groupId,
        userId: { in: memberIds },
      },
      select: {
        userId: true,
      },
    });
    const existingSet = new Set(existingMembers.map((m) => m.userId));
    // 3. 筛选出真正的新人
    const newMembers = memberIds.filter((id) => !existingSet.has(id));
    if (newMembers.length === 0) {
      return { count: 0 };
    }

    // 4. 批量插入成员
    await this.prisma.chatMember.createMany({
      data: newMembers.map((uid) => ({
        conversationId: groupId,
        userId: uid,
        role: ChatMemberRole.MEMBER,
        lastReadSeqId: 0, // 新人从头读，或者设为当前 seqId (看业务需求)
      })),
    });

    // 5. TODO: 这里应该通过 WebSocket 通知群里其他人 "User X invited User Y"
    return { count: newMembers.length };
  }

  /**
   * 功能：退出群聊
   * 逻辑：删除成员关系 -> 如果群空了，自毁会话
   */

  async leaveGroup(userId: string, groupId: string) {
    // 1. 检查是否存在
    const member = await this.prisma.chatMember.findUnique({
      where: {
        conversationId_userId: { conversationId: groupId, userId },
      },
    });
    if (!member) {
      throw new NotFoundException('You are not a member of this group');
    }

    // 2. 删除成员关系
    await this.prisma.chatMember.delete({
      where: {
        conversationId_userId: { conversationId: groupId, userId },
      },
    });
    // 3. 检查群是否空了
    const remainingMembers = await this.prisma.chatMember.count({
      where: { conversationId: groupId },
    });
    if (remainingMembers === 0) {
      // 群空了，删除会话
      await this.prisma.conversation.delete({
        where: { id: groupId },
      });
    }
    return { success: true };
  }

  // =================================================================
  //  场景 C: 手动建群 (Group)
  // =================================================================
  async createGroupChat(creatorId: string, dto: CreateGroupDto) {
    const { name, memberIds } = dto;

    // 去重并确保群主在成员列表中
    const uniqueMembers = Array.from(new Set([creatorId, ...memberIds]));

    return this.prisma.conversation.create({
      data: {
        type: CONVERSATION_TYPE.GROUP,
        name,
        status: ConversationStatus.NORMAL,
        lastMsgContent: 'Group created',
        lastMsgTime: new Date(),
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
      include: {
        members: {
          include: {
            user: { select: { id: true, nickname: true, avatar: true } },
          },
        },
      },
    });
  }

  // =================================================================
  //  辅助方法: 获取会话详情 (进房前/进房后调用)
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

    let partnerReadSeqId = 0;

    const partnerMember = await this.prisma.chatMember.findFirst({
      where: {
        conversationId: conversationId,
        userId: { not: userId }, // 对方
      },
      select: { lastReadSeqId: true },
    });

    if (partnerMember) {
      partnerReadSeqId = partnerMember.lastReadSeqId;
    }

    // 查消息
    const messages = await this.prisma.chatMessage.findMany({
      where: {
        conversationId,
        hiddenByUsers: {
          none: { userId }, // 排除被当前用户隐藏的消息
        },
      },
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
      seqId: msg.seqId,
      content: msg.content,
      type: msg.type,
      createdAt: msg.createdAt.getTime(),
      isSelf: msg.senderId === userId,
      isRecalled: msg.type === MESSAGE_TYPE.RECALLED,
      // 前端会从 meta['duration'] 里读取时长
      meta: msg.meta,
      sender: {
        id: msg.sender?.id,
        nickname: msg.sender?.nickname,
        avatar: msg.sender?.avatar,
      },
    }));
    return {
      list: mappedList,
      nextCursor: nextCursor,
      partnerLastReadSeqId: partnerReadSeqId, // 可选：如果需要，可以查对方的已读 SeqId
    };
  }

  // =======================================================
  //  搜索用户
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

  // 私有辅助方法：生成预览文本
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
      default:
        return '[Unsupported]';
    }
  }
}
