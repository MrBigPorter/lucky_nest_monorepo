import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, ConversationType } from '@prisma/client';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { UploadService } from '@api/common/upload/upload.service';
import { v4 as uuidv4 } from 'uuid';
import { QueryConversationsDto } from './dto/query-conversations.dto';
import {
  AdminReplyDto,
  AdminUploadTokenDto,
  CloseConversationDto,
  QueryMessagesDto,
} from './dto/admin-chat.dto';

/** Conversation.status 枚举值 */
const CONV_STATUS = { NORMAL: 1, CLOSED: 2 } as const;

/** 系统客服消息的类型（TEXT=0） */
const MSG_TYPE_TEXT = 0;
/** 系统消息类型（前端可以根据 senderId===null 判断样式） */
const MSG_TYPE_SYSTEM = 99;

@Injectable()
export class AdminChatService {
  private readonly logger = new Logger(AdminChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  // ─────────────────────────────────────────────
  // 1. 会话列表
  // ─────────────────────────────────────────────
  async getConversations(dto: QueryConversationsDto) {
    const { page = 1, pageSize = 20, type, keyword, status } = dto;

    const where: Prisma.ConversationWhereInput = {
      // 默认只看 SUPPORT，若传了 type 则按传入值
      type: type ?? ConversationType.SUPPORT,
    };

    if (status !== undefined) {
      where.status = status;
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        {
          members: {
            some: {
              user: {
                nickname: { contains: keyword, mode: 'insensitive' },
              },
            },
          },
        },
      ];
    }

    const [total, list] = await Promise.all([
      this.prisma.conversation.count({ where }),
      this.prisma.conversation.findMany({
        where,
        orderBy: { lastMsgTime: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          members: {
            include: {
              user: { select: { id: true, nickname: true, avatar: true } },
            },
            take: 10,
          },
        },
      }),
    ]);

    return {
      list: list.map((c) => ({
        id: c.id,
        type: c.type,
        name: c.name,
        status: c.status,
        lastMsgContent: c.lastMsgContent,
        lastMsgTime: c.lastMsgTime?.getTime() ?? 0,
        lastMsgSeqId: c.lastMsgSeqId,
        memberCount: c.members.length,
        members: c.members.map((m) => ({
          userId: m.userId,
          nickname: m.user?.nickname ?? null,
          avatar: m.user?.avatar ?? null,
          role: m.role,
        })),
      })),
      total,
      page,
      pageSize,
    };
  }

  // ─────────────────────────────────────────────
  // 2. 消息历史（游标分页，admin 无权限限制）
  // ─────────────────────────────────────────────
  async getMessages(conversationId: string, dto: QueryMessagesDto) {
    const { cursor, pageSize = 30 } = dto;

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, lastMsgSeqId: true },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    const where: Prisma.ChatMessageWhereInput = { conversationId };
    if (cursor) {
      where.seqId = { lt: cursor };
    }

    const messages = await this.prisma.chatMessage.findMany({
      where,
      orderBy: { seqId: 'desc' },
      take: pageSize,
      include: {
        sender: { select: { id: true, nickname: true, avatar: true } },
      },
    });

    const nextCursor =
      messages.length > 0 ? messages[messages.length - 1].seqId : null;

    return {
      list: messages.map((m) => ({
        id: m.id,
        seqId: m.seqId,
        content: m.content,
        type: m.type,
        isRecalled: m.isRecalled,
        createdAt: m.createdAt.getTime(),
        meta: m.meta,
        senderId: m.senderId,
        sender: m.sender
          ? {
              id: m.sender.id,
              nickname: m.sender.nickname,
              avatar: m.sender.avatar,
            }
          : null,
        isSystem: m.senderId === null,
      })),
      nextCursor,
      totalSeqId: conv.lastMsgSeqId,
    };
  }

  // ─────────────────────────────────────────────
  // 3. 客服回复（senderId = null → 系统消息）
  // ─────────────────────────────────────────────
  async replyToConversation(
    conversationId: string,
    dto: AdminReplyDto,
    adminName: string,
  ) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, status: true },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    const agentLabel = dto.agentName ?? adminName ?? 'Support';
    const msgType = dto.type ?? MSG_TYPE_TEXT;
    const finalContent = dto.content;
    const previewText = getMsgPreview(msgType, finalContent);

    const messageId = uuidv4();

    const message = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMsgSeqId: { increment: 1 },
          lastMsgContent: `[${agentLabel}]: ${previewText}`,
          lastMsgType: msgType,
          lastMsgTime: new Date(),
          status: CONV_STATUS.NORMAL,
        },
        select: { lastMsgSeqId: true },
      });

      return tx.chatMessage.create({
        data: {
          id: messageId,
          conversationId,
          senderId: null,
          content: finalContent,
          type: msgType,
          seqId: updated.lastMsgSeqId,
          meta: { agentName: agentLabel, isSupport: true, ...(dto.meta ?? {}) },
        },
      });
    });

    this.logger.log(
      `Admin [${adminName}] replied to conversation ${conversationId} (type=${msgType})`,
    );

    return {
      id: message.id,
      seqId: message.seqId,
      content: message.content,
      createdAt: message.createdAt.getTime(),
      isSystem: true,
      meta: message.meta,
    };
  }

  // ─────────────────────────────────────────────
  // 4. 强制撤回（不受2分钟限制）
  // ─────────────────────────────────────────────
  async forceRecallMessage(messageId: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Message not found');

    await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        isRecalled: true,
        content: '[Message Recalled by Support]',
        meta: {},
      },
    });

    this.logger.warn(`Admin force-recalled message ${messageId}`);
    return { success: true, messageId };
  }

  // ─────────────────────────────────────────────
  // 5. 关闭/归档会话
  // ─────────────────────────────────────────────
  async closeConversation(
    conversationId: string,
    dto: CloseConversationDto,
    adminName: string,
  ) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    const reason = dto.reason ?? 'Closed by support agent';
    const messageId = uuidv4();

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.conversation.update({
        where: { id: conversationId },
        data: {
          status: CONV_STATUS.CLOSED,
          lastMsgSeqId: { increment: 1 },
          lastMsgContent: `[System]: ${reason}`,
          lastMsgType: MSG_TYPE_SYSTEM,
          lastMsgTime: new Date(),
        },
        select: { lastMsgSeqId: true },
      });

      await tx.chatMessage.create({
        data: {
          id: messageId,
          conversationId,
          senderId: null,
          content: reason,
          type: MSG_TYPE_SYSTEM,
          seqId: updated.lastMsgSeqId,
          meta: { closedBy: adminName, isClose: true },
        },
      });
    });

    this.logger.log(
      `Admin [${adminName}] closed conversation ${conversationId}`,
    );
    return { success: true, conversationId };
  }

  // ─────────────────────────────────────────────
  // 6. Admin 上传 Token（图片/文件消息前先获取签名 URL）
  // ─────────────────────────────────────────────
  async getUploadToken(adminId: string, dto: AdminUploadTokenDto) {
    return this.uploadService.generatePresignedUrl(
      adminId,
      dto.fileName,
      dto.fileType,
      'chat',
    );
  }
}
