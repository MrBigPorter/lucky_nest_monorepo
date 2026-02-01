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
import { CreateGroupDto } from '@api/common/chat/dto/group-chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  // =================================================================
  //  CORE OPERATION: sendMessage (Unified Meta-First Engine)
  // =================================================================
  async sendMessage(userId: string, dto: CreateMessageDto) {
    const { id, conversationId, content, type, meta } = dto;

    // 1. Idempotency Check: Prevent duplicate messages from network retries.
    const existingMessage = await this.prisma.chatMessage.findUnique({
      where: { id },
    });
    if (existingMessage) {
      if (existingMessage.senderId !== userId)
        throw new ForbiddenException('Message ID conflict');
      return {
        ...existingMessage,
        createdAt: existingMessage.createdAt.getTime(),
        isSelf: true,
      };
    }

    // 2. Meta Assembly: Merge nested meta object with legacy flattened fields.
    const finalMeta: Record<string, any> = dto.meta || {};
    if (type === MESSAGE_TYPE.AUDIO && meta?.duration)
      finalMeta.duration = meta.duration;
    if (
      (type === MESSAGE_TYPE.IMAGE || type === MESSAGE_TYPE.VIDEO) &&
      meta?.w &&
      meta?.h
    ) {
      finalMeta.w = meta.w;
      finalMeta.h = meta.h;
    }

    //  新增：File 处理 (确保关键字段被保留)
    if (type === MESSAGE_TYPE.FILE) {
      if (meta?.fileName) finalMeta.fileName = meta.fileName;
      if (meta?.fileSize) finalMeta.fileSize = meta.fileSize;
      if (meta?.fileExt) finalMeta.fileExt = meta.fileExt;
    }

    //  新增：Location 处理
    if (type === MESSAGE_TYPE.LOCATION) {
      if (meta?.latitude) finalMeta.latitude = meta.latitude;
      if (meta?.longitude) finalMeta.longitude = meta.longitude;
      if (meta?.address) finalMeta.address = meta.address;
      if (meta?.title) finalMeta.title = meta.title;
      if (meta?.thumb) finalMeta.thumb = meta.thumb;
    }

    // 3. Database Transaction: Atomic update for Sequence ID and Snapshot.
    const message = await this.prisma.$transaction(async (tx) => {
      // Update Conversation SeqID and last message preview
      const conv = await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMsgSeqId: { increment: 1 },
          lastMsgContent: this._getPreviewText(type, content),
          lastMsgType: type,
          lastMsgTime: new Date(),
        },
        select: { lastMsgSeqId: true },
      });

      // Create main message record
      const msg = await tx.chatMessage.create({
        data: {
          id,
          conversationId,
          senderId: userId,
          content,
          type,
          meta: Object.keys(finalMeta).length > 0 ? finalMeta : undefined,
          seqId: conv.lastMsgSeqId,
        },
        include: {
          sender: { select: { id: true, nickname: true, avatar: true } },
        },
      });

      // Update sender's read progress instantly
      await tx.chatMember.updateMany({
        where: { conversationId, userId },
        data: { lastReadSeqId: conv.lastMsgSeqId },
      });

      return msg;
    });

    const messageDto = {
      ...message,
      createdAt: message.createdAt.getTime(),
      isRecalled: false,
    };

    // 4. Broadcasting: Emit to the room (others) and individual personal rooms (sync).
    this.eventsGateway.server
      .to(conversationId)
      .emit(SocketEvents.CHAT_MESSAGE, { ...messageDto, isSelf: false });
    this._notifyOtherMembers(userId, conversationId, messageDto);

    return { ...messageDto, isSelf: true };
  }

  // =================================================================
  //  CORE OPERATION: recallMessage (2-Minute Rule)
  // =================================================================
  async recallMessage(userId: string, messageId: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId)
      throw new ForbiddenException('Cannot recall others messages');

    // Strict 120-second recall window
    if (!TimeHelper.isWithinRange(message.createdAt, new Date(), 120000)) {
      throw new ForbiddenException('Recall window expired');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.chatMessage.update({
        where: { id: messageId },
        data: {
          content: '[Message Recalled]',
          type: MESSAGE_TYPE.RECALLED,
          meta: {},
        },
      });

      const conv = await tx.conversation.findUnique({
        where: { id: msg.conversationId },
        select: { lastMsgSeqId: true },
      });
      if (conv?.lastMsgSeqId === msg.seqId) {
        await tx.conversation.update({
          where: { id: msg.conversationId },
          data: {
            lastMsgContent: '[Message Recalled]',
            lastMsgType: MESSAGE_TYPE.RECALLED,
          },
        });
      }
      return { messageId: msg.id, tip: 'Message recalled', seqId: msg.seqId };
    });

    // 对应 Flutter 的 SocketRecallEvent 模型
    const recallPayload = {
      conversationId: message.conversationId,
      messageId: messageId,
      tip: 'A message was recalled',
      operatorId: userId,
      seqId: result.seqId,
    };

    this.eventsGateway.server
      .to(message.conversationId)
      .emit(SocketEvents.MESSAGE_RECALLED, {
        ...recallPayload,
        // 前端区分自己和他人撤回
        isSelf: false,
      });

    // 2.：精准推送给该会话的所有成员 (包含离线/退房用户同步)
    // 这样即便手机端因为 autoDispose 暂时断开了会话房间，只要 Socket 连着，就能收到个人频道的更新
    this._notifyRecallToMembers(message.conversationId, recallPayload);
    return result;
  }

  // --- 辅助方法：通知所有成员撤回指令 ---
  private _notifyRecallToMembers(conversationId: string, data: any) {
    this.prisma.chatMember
      .findMany({
        where: { conversationId },
        select: { userId: true },
      })
      .then((members) => {
        members.forEach((m) => {
          this.eventsGateway.server
            .to(`user_${m.userId}`)
            .emit(SocketEvents.MESSAGE_RECALLED, {
              ...data,
              isSelf: data.operatorId === m.userId,
            });
        });
      });
  }

  // =================================================================
  //  CORE OPERATION: deleteMessage (Soft Delete)
  // =================================================================
  async deleteMessage(userId: string, dto: DeleteMessageDto) {
    const { messageId } = dto;
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');

    // Idempotent concealment record creation
    await this.prisma.chatMessageHide.upsert({
      where: { userId_messageId: { userId, messageId } },
      update: {},
      create: { userId, messageId },
    });
    return { messageId };
  }

  // =================================================================
  //  CORE OPERATION: markAsRead (Read Sync)
  // =================================================================
  async markAsRead(userId: string, dto: MarkAsReadDto) {
    const { conversationId, maxSeqId } = dto;
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { lastMsgSeqId: true },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const targetSeqId = maxSeqId
      ? Math.min(maxSeqId, conversation.lastMsgSeqId)
      : conversation.lastMsgSeqId;
    const updatedMember = await this.prisma.chatMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadSeqId: targetSeqId },
      select: { lastReadSeqId: true },
    });

    //  对应 Flutter 的 SocketReadEvent 模型
    const readPayload = {
      conversationId,
      readerId: userId,
      lastReadSeqId: targetSeqId,
    };

    // 广播给房间内其他人
    this.eventsGateway.server
      .to(conversationId)
      .emit(SocketEvents.CONVERSATION_READ, {
        ...readPayload,
        isSelf: false,
      });

    // 推送给个人频道
    this.eventsGateway.server
      .to(`user_${userId}`)
      .emit(SocketEvents.CONVERSATION_READ, {
        ...readPayload,
        isSelf: true,
      });

    return { lastReadSeqId: updatedMember.lastReadSeqId };
  }

  // =================================================================
  //  QUERIES: Lists & Details (N+1 Optimized)
  // =================================================================
  async getConversationList(userId: string, page = 1, pageSize = 200) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        members: { some: { userId } },
        status: ConversationStatus.NORMAL,
      },
      include: { members: { where: { userId } } },
      orderBy: { lastMsgTime: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Batch resolve Direct Chat partners to avoid N+1 queries
    const directIds = conversations
      .filter((c) => c.type === CONVERSATION_TYPE.DIRECT)
      .map((c) => c.id);
    const partnersMap = new Map();
    if (directIds.length > 0) {
      const partners = await this.prisma.chatMember.findMany({
        where: { conversationId: { in: directIds }, userId: { not: userId } },
        include: { user: { select: { nickname: true, avatar: true } } },
      });
      partners.forEach((p) => partnersMap.set(p.conversationId, p.user));
    }

    return conversations.map((conv) => {
      const partner = partnersMap.get(conv.id);
      const mySettings = conv.members[0];
      return new ConversationListResponseDto({
        id: conv.id,
        type: conv.type,
        name: partner?.nickname || conv.name || 'Unknown',
        avatar: partner?.avatar || conv['avatar'],
        lastMsgContent: conv.lastMsgContent,
        lastMsgTime: conv.lastMsgTime?.getTime() || 0,
        isPinned: mySettings?.isPinned ?? false,
        isMuted: mySettings?.isMuted ?? false,
        unreadCount: Math.max(
          0,
          conv.lastMsgSeqId - (mySettings?.lastReadSeqId ?? 0),
        ),
      });
    });
  }

  async getConversationDetail(conversationId: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            user: { select: { id: true, nickname: true, avatar: true } },
          },
          orderBy: { role: 'asc' },
        },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    let displayName = conv.name;
    let displayAvatar = conv['avatar'];
    if (conv.type === CONVERSATION_TYPE.DIRECT) {
      const partner = conv.members.find((m) => m.userId !== userId);
      if (partner) {
        displayName = partner.user.nickname;
        displayAvatar = partner.user.avatar;
      }
    }

    return {
      id: conv.id,
      name: displayName,
      avatar: displayAvatar,
      type: conv.type,
      ownerId: conv.ownerId,
      memberCount: conv.members.length,
      members: conv.members.map((m) => ({
        userId: m.userId,
        nickname: m.user.nickname,
        avatar: m.user.avatar,
        role: m.role,
      })),
    };
  }

  // =================================================================
  //  CORE OPERATION: getMessages (SeqId Optimization)
  // =================================================================
  async getMessages(userId: string, dto: GetMessagesDto) {
    // 1. DTO 已经自动转换了类型，这里 cursor 就是 number (seqId)
    const { conversationId, cursor, pageSize = 20 } = dto;

    const partner = await this.prisma.chatMember.findFirst({
      where: { conversationId, userId: { not: userId } },
      select: { lastReadSeqId: true },
    });

    // 2. 构造查询条件
    const whereCondition: any = {
      conversationId,
      hiddenByUsers: { none: { userId } },
    };

    //  核心：基于 SeqId 的范围查询
    // 如果传了 cursor (seqId)，就查比它小的 (历史消息)
    if (cursor) {
      whereCondition.seqId = { lt: cursor };
    }

    const messages = await this.prisma.chatMessage.findMany({
      where: whereCondition,
      orderBy: { seqId: 'desc' }, // 倒序
      take: pageSize, // 不需要 +1，也不需要 skip
      include: {
        sender: { select: { id: true, nickname: true, avatar: true } },
      },
    });

    // 3. 计算下一页游标 (Next SeqId)
    let nextCursor: number | null = null;
    if (messages.length > 0) {
      // 取最后一条消息的 seqId 作为下一次请求的 cursor
      nextCursor = messages[messages.length - 1].seqId;
    }

    return {
      list: messages.map((m) => ({
        id: m.id,
        seqId: m.seqId,
        content: m.content,
        type: m.type,
        createdAt: m.createdAt.getTime(),
        isSelf: m.senderId === userId,
        meta: m.meta,
        sender: m.sender,
      })),
      // 这里返回 number 类型的游标
      nextCursor,
      partnerLastReadSeqId: partner?.lastReadSeqId ?? 0,
    };
  }

  // =================================================================
  //  GROUP & MEMBERSHIP (Business, Direct, Group)
  // =================================================================

  async ensureBusinessConversation(businessId: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: { businessId },
    });
    if (existing) return existing;
    return this.prisma.conversation.create({
      data: {
        type: CONVERSATION_TYPE.BUSINESS,
        businessId,
        name: `Business ${businessId}`,
        status: ConversationStatus.NORMAL,
        lastMsgContent: 'Welcome!',
        lastMsgTime: new Date(),
      },
    });
  }

  async addMemberToBusinessGroup(businessId: string, userId: string) {
    const conversation = await this.ensureBusinessConversation(businessId);
    return this.prisma.chatMember.upsert({
      where: {
        conversationId_userId: { conversationId: conversation.id, userId },
      },
      update: { role: ChatMemberRole.MEMBER },
      create: {
        conversationId: conversation.id,
        userId,
        role: ChatMemberRole.MEMBER,
      },
    });
  }

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
          create: [
            { userId: myId, role: ChatMemberRole.OWNER },
            { userId: targetId, role: ChatMemberRole.OWNER },
          ],
        },
      },
    });
  }

  async inviteToGroup(
    operatorId: string,
    dto: { groupId: string; memberIds: string[] },
  ) {
    const { groupId, memberIds } = dto;
    const operator = await this.prisma.chatMember.findUnique({
      where: {
        conversationId_userId: { conversationId: groupId, userId: operatorId },
      },
    });
    if (!operator) throw new ForbiddenException('Not a member');

    const existing = await this.prisma.chatMember.findMany({
      where: { conversationId: groupId, userId: { in: memberIds } },
      select: { userId: true },
    });
    const existingSet = new Set(existing.map((m) => m.userId));
    const newMembers = memberIds.filter((id) => !existingSet.has(id));
    if (newMembers.length > 0) {
      await this.prisma.chatMember.createMany({
        data: newMembers.map((uid) => ({
          conversationId: groupId,
          userId: uid,
          role: ChatMemberRole.MEMBER,
          lastReadSeqId: 0,
        })),
      });
    }
    return { count: newMembers.length };
  }

  async leaveGroup(userId: string, groupId: string) {
    await this.prisma.chatMember.delete({
      where: { conversationId_userId: { conversationId: groupId, userId } },
    });
    const remaining = await this.prisma.chatMember.count({
      where: { conversationId: groupId },
    });
    if (remaining === 0)
      await this.prisma.conversation.delete({ where: { id: groupId } });
    return { success: true };
  }

  async createGroupChat(creatorId: string, dto: CreateGroupDto) {
    const uniqueMembers = Array.from(new Set([creatorId, ...dto.memberIds]));
    return this.prisma.conversation.create({
      data: {
        type: CONVERSATION_TYPE.GROUP,
        name: dto.name,
        status: ConversationStatus.NORMAL,
        lastMsgContent: 'Group created',
        lastMsgTime: new Date(),
        ownerId: creatorId,
        members: {
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

  async searchUsers(myUserId: string, dto: SearchUserDto) {
    return this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: myUserId } },
          {
            OR: [
              { nickname: { contains: dto.keyword, mode: 'insensitive' } },
              { phone: { contains: dto.keyword } },
            ],
          },
        ],
      },
      take: 20,
      select: { id: true, nickname: true, avatar: true },
    });
  }

  // --- Internal Support ---
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
      //  新增：文件消息预览
      case MESSAGE_TYPE.FILE:
        return '[File]';

      //  新增：位置消息预览
      case MESSAGE_TYPE.LOCATION:
        return '[Location]';
      default:
        return '[Unsupported]';
    }
  }

  private _notifyOtherMembers(
    senderId: string,
    conversationId: string,
    data: any,
  ) {
    this.prisma.chatMember
      .findMany({
        where: { conversationId, userId: { not: senderId } },
        select: { userId: true },
      })
      .then((members) =>
        members.forEach((m) =>
          this.eventsGateway.server
            .to(`user_${m.userId}`)
            .emit(SocketEvents.CHAT_MESSAGE, data),
        ),
      );
  }
}
