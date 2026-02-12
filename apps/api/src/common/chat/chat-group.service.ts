import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  KickMemberDto,
  MuteMemberDto,
  SetAdminDto,
  TransferOwnerDto,
  UpdateGroupInfoDto,
} from '@api/common/chat/dto/group/group-manage.dto';
import {
  CHAT_GROUP_EVENTS,
  GroupInfoUpdatedEvent,
  GroupMemberKickedEvent,
  GroupMemberMutedEvent,
  GroupOwnerTransferredEvent,
  GroupMemberRoleUpdatedEvent,
  GroupDisbandedEvent,
  GroupMemberLeftEvent,
} from '@api/common/chat/events/chat-group.events';
import { ChatMemberRole } from '@lucky/shared';
import {
  CHAT_EVENTS,
  MessageCreatedEvent,
} from '@api/common/chat/events/chat.events';

@Injectable()
export class ChatGroupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // =================================================================
  //   Helper: Permission Guard
  // =================================================================
  private async _checkPermission(
    operatorId: string,
    conversationId: string,
    requiredRoles: ChatMemberRole[],
  ) {
    const member = await this.prisma.chatMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: operatorId } },
      select: { role: true, user: { select: { nickname: true } } },
    });

    if (!member) throw new ForbiddenException('You are not a member');
    // 强制类型转换，确保是枚举
    const role = member.role as ChatMemberRole;
    if (!requiredRoles.includes(role)) {
      throw new ForbiddenException('Permission denied');
    }
    return member;
  }

  // =================================================================
  //  Action 1: Kick Member (踢人)
  // =================================================================
  async kickMember(operatorId: string, dto: KickMemberDto) {
    const operator = await this._checkPermission(
      operatorId,
      dto.conversationId,
      [ChatMemberRole.OWNER, ChatMemberRole.ADMIN],
    );

    //  [Standard] 统一变量名逻辑: targetUserId -> targetId
    const targetId = dto.targetUserId;

    if (operatorId === targetId)
      throw new BadRequestException('Cannot kick yourself');

    const target = await this.prisma.chatMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: dto.conversationId,
          userId: targetId,
        },
      },
      include: { user: { select: { nickname: true } } },
    });

    if (!target) throw new NotFoundException('Member not found');
    if (target.role === ChatMemberRole.OWNER)
      throw new ForbiddenException('Cannot kick owner');

    // 只有群主能踢管理员，管理员不能踢管理员
    if (
      operator.role === ChatMemberRole.ADMIN &&
      target.role === ChatMemberRole.ADMIN
    ) {
      throw new ForbiddenException('Admin cannot kick admin');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.chatMember.delete({
        where: {
          conversationId_userId: {
            conversationId: dto.conversationId,
            userId: targetId,
          },
        },
      });
      await this._createSystemMessage(
        tx,
        dto.conversationId,
        `${target.user.nickname} was removed from the group`,
      );
    });

    this.eventEmitter.emit(
      CHAT_GROUP_EVENTS.MEMBER_KICKED,
      new GroupMemberKickedEvent(
        dto.conversationId,
        operatorId,
        targetId,
        Date.now(),
      ), // targetId 对应构造函数
    );

    return { success: true, kickedUserId: targetId };
  }

  // =================================================================
  //  Action 2: Mute Member (禁言/解除禁言)
  // =================================================================
  async muteMember(operatorId: string, dto: MuteMemberDto) {
    await this._checkPermission(operatorId, dto.conversationId, [
      ChatMemberRole.OWNER,
      ChatMemberRole.ADMIN,
    ]);

    // duration > 0 是禁言，= 0 是解除禁言 (mutedUntil = null)
    const mutedUntil =
      dto.duration > 0 ? new Date(Date.now() + dto.duration * 1000) : null;

    const member = await this.prisma.chatMember.update({
      where: {
        conversationId_userId: {
          conversationId: dto.conversationId,
          userId: dto.targetUserId,
        },
      },
      data: { mutedUntil },
    });

    const mutedUntilTimestamp = member.mutedUntil
      ? member.mutedUntil.getTime()
      : null;

    this.eventEmitter.emit(
      CHAT_GROUP_EVENTS.MEMBER_MUTED,
      new GroupMemberMutedEvent(
        dto.conversationId,
        operatorId,
        dto.targetUserId,
        mutedUntilTimestamp,
      ), // 统一 targetId
    );

    return { success: true, mutedUntil: mutedUntilTimestamp };
  }

  // =================================================================
  //  Action 3: Set Admin (升降职)
  // =================================================================
  async setAdmin(operatorId: string, dto: SetAdminDto) {
    await this._checkPermission(operatorId, dto.conversationId, [
      ChatMemberRole.OWNER,
    ]);

    //  [Fix] 防止对群主操作 (虽然群主操作自己也没意义，但加上更安全)
    const targetMember = await this.prisma.chatMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: dto.conversationId,
          userId: dto.targetUserId,
        },
      },
    });
    if (!targetMember) throw new NotFoundException('Target member not found');
    if (targetMember.role === ChatMemberRole.OWNER) {
      throw new ForbiddenException('Cannot change role of the Owner');
    }

    const targetRole = dto.isAdmin
      ? ChatMemberRole.ADMIN
      : ChatMemberRole.MEMBER;

    await this.prisma.chatMember.update({
      where: {
        conversationId_userId: {
          conversationId: dto.conversationId,
          userId: dto.targetUserId,
        },
      },
      data: { role: targetRole },
    });

    const sysMsg = dto.isAdmin ? 'appointed as Admin' : 'removed from Admin';
    await this._createSystemMessage(
      this.prisma,
      dto.conversationId,
      `Member role updated: ${sysMsg}`,
    );

    this.eventEmitter.emit(
      CHAT_GROUP_EVENTS.MEMBER_ROLE_UPDATED,
      new GroupMemberRoleUpdatedEvent(
        dto.conversationId,
        operatorId,
        dto.targetUserId,
        targetRole,
      ),
    );

    return { success: true, role: targetRole };
  }

  // =================================================================
  //  Action 4: Transfer Owner (转让群主)
  // =================================================================
  async transferOwner(operatorId: string, dto: TransferOwnerDto) {
    await this._checkPermission(operatorId, dto.conversationId, [
      ChatMemberRole.OWNER,
    ]);

    //  [Fix] 必须先检查新群主是否在群里
    const newOwner = await this.prisma.chatMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: dto.conversationId,
          userId: dto.newOwnerId,
        },
      },
    });
    if (!newOwner)
      throw new NotFoundException('New owner must be a group member');

    await this.prisma.$transaction(async (tx) => {
      // 1. Old owner -> Member
      await tx.chatMember.update({
        where: {
          conversationId_userId: {
            conversationId: dto.conversationId,
            userId: operatorId,
          },
        },
        data: { role: ChatMemberRole.MEMBER },
      });

      // 2. New owner -> Owner
      await tx.chatMember.update({
        where: {
          conversationId_userId: {
            conversationId: dto.conversationId,
            userId: dto.newOwnerId,
          },
        },
        data: { role: ChatMemberRole.OWNER },
      });

      // 3. Update Conversation Owner
      await tx.conversation.update({
        where: { id: dto.conversationId },
        data: { ownerId: dto.newOwnerId },
      });

      await this._createSystemMessage(
        tx,
        dto.conversationId,
        'Group ownership transferred',
      );
    });

    this.eventEmitter.emit(
      CHAT_GROUP_EVENTS.OWNER_TRANSFERRED,
      new GroupOwnerTransferredEvent(
        dto.conversationId,
        operatorId,
        dto.newOwnerId, // targetId
      ),
    );

    return { success: true };
  }

  // =================================================================
  //  Action 5: Update Info (改名/公告/全员禁言)
  // =================================================================
  async updateGroupInfo(operatorId: string, dto: UpdateGroupInfoDto) {
    await this._checkPermission(operatorId, dto.conversationId, [
      ChatMemberRole.OWNER,
      ChatMemberRole.ADMIN,
    ]);

    //  [Standard] 精确构建 update 对象，防止 undefined 污染
    const dataToUpdate: any = {};
    const updatesForEvent: any = {}; // 专门用于 Event 的 Payload

    if (dto.name !== undefined && dto.name !== null) {
      dataToUpdate.name = dto.name;
      updatesForEvent.name = dto.name;
    }

    if (dto.avatar !== undefined) {
      dataToUpdate.avatar = dto.avatar;
      updatesForEvent.avatar = dto.avatar;
    }

    if (dto.announcement !== undefined && dto.announcement !== null) {
      dataToUpdate.announcement = dto.announcement;
      dataToUpdate.announcementAt = new Date();
      updatesForEvent.announcement = dto.announcement;
    }

    if (dto.isMuteAll !== undefined && dto.isMuteAll !== null) {
      dataToUpdate.isMuteAll = dto.isMuteAll;
      updatesForEvent.isMuteAll = dto.isMuteAll;
    }

    if (dto.joinNeedApproval !== undefined) {
      dataToUpdate.joinNeedApproval = dto.joinNeedApproval;
      updatesForEvent.joinNeedApproval = dto.joinNeedApproval;
    }

    // 如果没有实质性修改，直接返回
    if (Object.keys(dataToUpdate).length === 0) {
      const currentGroup = await this.prisma.conversation.findUnique({
        where: { id: dto.conversationId },
      });

      if (!currentGroup) throw new NotFoundException('Group not found');

      return {
        id: currentGroup.id,
        name: currentGroup.name ?? 'Group',
        avatar: currentGroup.avatar,
        announcement: currentGroup.announcement ?? undefined,
        isMuteAll: currentGroup.isMuteAll,
      };
    }

    const group = await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: dataToUpdate,
    });

    // 3. 关键修正：生成系统消息 (让列表页感知)
    // 只要改名，就发一条 type 99 的系统消息
    if (dto.name) {
      await this._createSystemMessage(
        this.prisma,
        dto.conversationId,
        `Group name updated to "${dto.name}"`,
        {
          action: 'UPDATE_INFO',
          updates: { name: dto.name },
        },
      );
    }

    // 系统消息 (仅针对公告变更，全员禁言可以不发系统消息，或者单独发)
    if (dto.announcement) {
      await this._createSystemMessage(
        this.prisma,
        dto.conversationId,
        `Announcement updated: ${dto.announcement}`,
        {
          action: 'UPDATE_INFO',
          updates: { name: dto.name },
        },
      );
    }

    this.eventEmitter.emit(
      CHAT_GROUP_EVENTS.INFO_UPDATED,
      new GroupInfoUpdatedEvent(
        dto.conversationId,
        operatorId,
        updatesForEvent, //  [Fix] 只传修改了的字段
      ),
    );

    return {
      id: group.id,
      name: group.name ?? 'Group',
      avatar: group.avatar,
      announcement: group.announcement ?? undefined,
      isMuteAll: group.isMuteAll,
    };
  }

  // =================================================================
  //  Action 6: Disband Group (解散群)
  // =================================================================
  async disbandGroup(operatorId: string, conversationId: string) {
    await this._checkPermission(operatorId, conversationId, [
      ChatMemberRole.OWNER,
    ]);

    // 软删除: status = 0 (或者根据业务需求做物理删除)
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 0 },
    });

    this.eventEmitter.emit(
      CHAT_GROUP_EVENTS.GROUP_DISBANDED,
      new GroupDisbandedEvent(conversationId, operatorId, Date.now()),
    );

    return { success: true };
  }

  // =================================================================
  //  Action 7: Leave Group (主动退群)
  // =================================================================
  async leaveGroup(userId: string, conversationId: string) {
    const member = await this.prisma.chatMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      include: { user: { select: { nickname: true } } }, // 获取昵称用于发消息
    });
    if (!member) throw new NotFoundException('Not a member');

    if (member.role === ChatMemberRole.OWNER) {
      throw new ForbiddenException(
        'Owner cannot leave group directly. Transfer ownership or disband group first.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.chatMember.delete({
        where: { conversationId_userId: { conversationId, userId } },
      });

      //  [Fix] 增加一条退群灰条消息，让群里人知道
      await this._createSystemMessage(
        tx,
        conversationId,
        `${member.user.nickname} left the group`,
      );
    });

    this.eventEmitter.emit(
      CHAT_GROUP_EVENTS.MEMBER_LEFT,
      new GroupMemberLeftEvent(conversationId, userId, Date.now()),
    );

    return { success: true };
  }

  // =================================================================
  //  Helper: Create System Message
  // =================================================================
  private async _createSystemMessage(
    tx: any, // Prisma Transaction Client
    conversationId: string,
    content: string,
    meta: Record<string, any> = {}, // 新增 meta 参数
  ) {
    // 1. 定义熔断阈值 (比如 500 人)
    const LARGE_GROUP_LIMIT = 500;

    // 2. 先只查一下人数 (Count 是极快的 O(1))
    const memberCount = await tx.chatMember.count({
      where: { conversationId },
    });

    // 3. 更新会话最新消息指针
    const conv = await tx.conversation.update({
      where: { id: conversationId },
      data: {
        lastMsgSeqId: { increment: 1 },
        lastMsgContent: content,
        lastMsgType: 99, // 99 = SYSTEM
        lastMsgTime: new Date(),
      },
      select: { lastMsgSeqId: true },
    });

    // 4. 创建消息记录 (DB 必须有，保证历史记录完整)
    const message = await tx.chatMessage.create({
      data: {
        conversationId,
        senderId: null,
        type: 99,
        content,
        seqId: conv.lastMsgSeqId,
        meta: meta, //  存入数据库 JSON 字段
      },
    });

    // 5. 关键修正：大群直接传空数组！
    let memberIds: string[] = [];

    if (memberCount <= LARGE_GROUP_LIMIT) {
      // 只有小群，才去查所有人的 ID，进行列表页推送
      const members = await tx.chatMember.findMany({
        where: { conversationId },
        select: { userId: true },
      });
      memberIds = members.map((m: { userId: any }) => m.userId);
    } else {
      // 大群：不查 ID，不发个人推送。
      // 效果：列表页不会跳动，保护服务器。
    }

    // 6. 触发事件
    this.eventEmitter.emit(
      CHAT_EVENTS.MESSAGE_CREATED,
      new MessageCreatedEvent(
        message.id,
        conversationId,
        content,
        99,
        '',
        'System',
        '',
        message.createdAt.getTime(),
        memberIds, // 如果是大群，这里是空的，SocketListener 就不会跑循环
        message.seqId,
        meta,
      ),
    );

    return message;
  }
}
