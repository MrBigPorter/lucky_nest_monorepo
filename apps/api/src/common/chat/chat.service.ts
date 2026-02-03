import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
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
import { SearchUserDto } from '@api/common/chat/dto/search-user.dto';
import { GetMessagesDto } from '@api/common/chat/dto/get-messages.dto';
import { EventsGateway } from '@api/common/events/events.gateway';
import { CreateMessageDto } from '@api/common/chat/dto/create-message.dto';
import { MarkAsReadDto } from '@api/common/chat/dto/mark-as-read.dto';
import { DeleteMessageDto } from '@api/common/chat/dto/delete-message.dto';
import { CreateGroupDto } from '@api/common/chat/dto/group-chat.dto';
import { AVATAR_QUEUE_NAME } from '@api/common/avatar/avatar.processor';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { ConversationListResponseDto } from '@api/common/chat/dto/conversation.response.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    @InjectQueue(AVATAR_QUEUE_NAME) private readonly avatarQueue: Queue,
  ) {}

  // =================================================================
  //  CORE OPERATION: sendMessage (Unified Meta-First Engine)
  // =================================================================
  async sendMessage(userId: string, dto: CreateMessageDto) {
    const { id, conversationId, content, type, meta } = dto;

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

    if (type === MESSAGE_TYPE.FILE) {
      if (meta?.fileName) finalMeta.fileName = meta.fileName;
      if (meta?.fileSize) finalMeta.fileSize = meta.fileSize;
      if (meta?.fileExt) finalMeta.fileExt = meta.fileExt;
    }

    if (type === MESSAGE_TYPE.LOCATION) {
      if (meta?.latitude) finalMeta.latitude = meta.latitude;
      if (meta?.longitude) finalMeta.longitude = meta.longitude;
      if (meta?.address) finalMeta.address = meta.address;
      if (meta?.title) finalMeta.title = meta.title;
      if (meta?.thumb) finalMeta.thumb = meta.thumb;
    }

    const message = await this.prisma.$transaction(async (tx) => {
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

    /**
     *  修改点 1: 修改消息广播逻辑
     * 不再直接 emit(SocketEvents.CHAT_MESSAGE)，而是通过 dispatch 分发
     */
    this.eventsGateway.dispatch(conversationId, SocketEvents.CHAT_MESSAGE, {
      ...messageDto,
      isSelf: false,
    });

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

    const recallPayload = {
      conversationId: message.conversationId,
      messageId: messageId,
      tip: 'A message was recalled',
      operatorId: userId,
      seqId: result.seqId,
    };

    /**
     *  修改点 2: 修改撤回广播逻辑
     * 统一使用 dispatch
     */
    this.eventsGateway.dispatch(
      message.conversationId,
      SocketEvents.MESSAGE_RECALLED,
      {
        ...recallPayload,
        isSelf: false,
      },
    );

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
          /**
           *  修改点 3: 内部通知成员撤回也改为 dispatch
           */
          this.eventsGateway.dispatch(
            `user_${m.userId}`,
            SocketEvents.MESSAGE_RECALLED,
            {
              ...data,
              isSelf: data.operatorId === m.userId,
            },
          );
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

    //  优化 1: 显式参数校验，防止 Prisma 引擎崩溃
    if (!conversationId) {
      throw new BadRequestException('Invalid conversationId');
    }

    try {
      // 1. 获取会话当前的最后消息序列号
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { lastMsgSeqId: true },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      // 2. 确定更新的已读位置：不能超过会话当前最大的 SeqId
      const targetSeqId = maxSeqId
        ? Math.min(maxSeqId, conversation.lastMsgSeqId)
        : conversation.lastMsgSeqId;

      // 3. 更新成员已读状态
      const updatedMember = await this.prisma.chatMember.update({
        where: {
          conversationId_userId: { conversationId, userId },
        },
        data: { lastReadSeqId: targetSeqId },
        select: { lastReadSeqId: true },
      });

      // 4. 构建统一的已读载荷
      const readPayload = {
        conversationId,
        readerId: userId,
        lastReadSeqId: targetSeqId,
      };

      //  优化 2: 修正广播逻辑
      // 仅向会话房间广播，让前端自行判断 isSelf
      // 这样可以减少 Socket 发送压力，并保持逻辑的一致性
      this.eventsGateway.dispatch(
        conversationId,
        SocketEvents.CONVERSATION_READ,
        readPayload,
      );

      return { lastReadSeqId: updatedMember.lastReadSeqId };
    } catch (error: any) {
      //  优化 3: 捕获 Prisma 可能抛出的底层错误
      this.logger.error(`[MarkAsRead Error] ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to mark messages as read');
    }
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
    const { conversationId, cursor, pageSize = 20 } = dto;

    const partner = await this.prisma.chatMember.findFirst({
      where: { conversationId, userId: { not: userId } },
      select: { lastReadSeqId: true },
    });

    const whereCondition: any = {
      conversationId,
      hiddenByUsers: { none: { userId } },
    };

    if (cursor) {
      whereCondition.seqId = { lt: cursor };
    }

    const messages = await this.prisma.chatMessage.findMany({
      where: whereCondition,
      orderBy: { seqId: 'desc' },
      take: pageSize,
      include: {
        sender: { select: { id: true, nickname: true, avatar: true } },
      },
    });

    let nextCursor: number | null = null;
    if (messages.length > 0) {
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
      this._triggerAvatarUpdate(groupId);
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
    if (remaining === 0) {
      await this.prisma.conversation.delete({ where: { id: groupId } });
    } else {
      this._triggerAvatarUpdate(groupId);
    }

    return { success: true };
  }

  async createGroupChat(creatorId: string, dto: CreateGroupDto) {
    const uniqueMembers = Array.from(new Set([creatorId, ...dto.memberIds]));
    const conversation = await this.prisma.conversation.create({
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
    this._triggerAvatarUpdate(conversation.id);

    return conversation;
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
              { id: { equals: dto.keyword } },
            ],
          },
        ],
      },
      take: 20,
      select: { id: true, nickname: true, avatar: true },
    });
  }

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
        return '[Unsupported]';
    }
  }

  /**
   *  修改点 5: 内部通知其他成员逻辑改为 dispatch
   */
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
          this.eventsGateway.dispatch(
            `user_${m.userId}`,
            SocketEvents.CHAT_MESSAGE,
            data,
          ),
        ),
      );
  }

  private _triggerAvatarUpdate(conversationId: string) {
    this.avatarQueue
      .add(
        'update_chat_group',
        { conversationId },
        {
          delay: 500,
          removeOnComplete: true,
          jobId: `chat_avatar_${conversationId}`,
        },
      )
      .catch((err) => {
        console.error(`[Chat Avatar Queue ERROR] ${err.message}`);
      });
  }
}
