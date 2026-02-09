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

    if (operatorId === dto.targetUserId)
      throw new BadRequestException('Cannot kick yourself');

    const target = await this.prisma.chatMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: dto.conversationId,
          userId: dto.targetUserId,
        },
      },
      include: { user: { select: { nickname: true } } },
    });

    if (!target) throw new NotFoundException('Member not found');
    if (target.role === ChatMemberRole.OWNER)
      throw new ForbiddenException('Cannot kick owner');
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
            userId: dto.targetUserId,
          },
        },
      });
      await this._createSystemMessage(
        tx,
        dto.conversationId,
        `${target.user.nickname} was removed from the group`,
      );
    });

    //  Emit Event
    this.eventEmitter.emit(
      CHAT_GROUP_EVENTS.MEMBER_KICKED,
      new GroupMemberKickedEvent(
        dto.conversationId,
        operatorId,
        dto.targetUserId,
        Date.now(),
      ),
    );

    return {
      success: true,
      kickedUserId: dto.targetUserId,
    };
  }

  // =================================================================
  //  Action 2: Mute Member (禁言)
  // =================================================================
  async muteMember(operatorId: string, dto: MuteMemberDto) {
    await this._checkPermission(operatorId, dto.conversationId, [
      ChatMemberRole.OWNER,
      ChatMemberRole.ADMIN,
    ]);

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

    //  Emit Event
    this.eventEmitter.emit(
      CHAT_GROUP_EVENTS.MEMBER_MUTED,
      new GroupMemberMutedEvent(
        dto.conversationId,
        operatorId,
        dto.targetUserId,
        mutedUntilTimestamp,
      ),
    );

    return { success: true, mutedUntil: mutedUntilTimestamp };
  }

  // =================================================================
  //  Action 3: Set Admin (升降职) [New]
  // =================================================================
  async setAdmin(operatorId: string, dto: SetAdminDto) {
    // Only Owner can set admins
    await this._checkPermission(operatorId, dto.conversationId, [
      ChatMemberRole.OWNER,
    ]);

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

    //  Emit Event
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

    await this.prisma.$transaction(async (tx) => {
      // Old owner -> Member
      await tx.chatMember.update({
        where: {
          conversationId_userId: {
            conversationId: dto.conversationId,
            userId: operatorId,
          },
        },
        data: { role: ChatMemberRole.MEMBER },
      });

      // New owner -> Owner
      await tx.chatMember.update({
        where: {
          conversationId_userId: {
            conversationId: dto.conversationId,
            userId: dto.newOwnerId,
          },
        },
        data: { role: ChatMemberRole.OWNER },
      });

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

    //  Emit Event
    this.eventEmitter.emit(
      CHAT_GROUP_EVENTS.OWNER_TRANSFERRED,
      new GroupOwnerTransferredEvent(
        dto.conversationId,
        operatorId,
        dto.newOwnerId,
      ),
    );

    return { success: true };
  }

  // =================================================================
  //  Action 5: Update Info (改名/公告)
  // =================================================================
  async updateGroupInfo(operatorId: string, dto: UpdateGroupInfoDto) {
    await this._checkPermission(operatorId, dto.conversationId, [
      ChatMemberRole.OWNER,
      ChatMemberRole.ADMIN,
    ]);

    const dataToUpdate: any = {};
    if (dto.name) dataToUpdate.name = dto.name;
    if (dto.isMuteAll !== undefined) dataToUpdate.isMuteAll = dto.isMuteAll;
    if (dto.joinNeedApproval !== undefined)
      dataToUpdate.joinNeedApproval = dto.joinNeedApproval;

    if (dto.announcement) {
      dataToUpdate.announcement = dto.announcement;
      dataToUpdate.announcementAt = new Date();
    }

    const group = await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: dataToUpdate,
    });

    if (dto.announcement) {
      await this._createSystemMessage(
        this.prisma,
        dto.conversationId,
        `Announcement: ${dto.announcement}`,
      );
    }

    //  Emit Event
    this.eventEmitter.emit(
      CHAT_GROUP_EVENTS.INFO_UPDATED,
      new GroupInfoUpdatedEvent(dto.conversationId, operatorId, {
        name: dto.name,
        announcement: dto.announcement,
        isMuteAll: dto.isMuteAll,
        joinNeedApproval: dto.joinNeedApproval,
      }),
    );

    return {
      id: group.id,
      name: group.name ?? 'Group', //  使用 ?? 确保返回 string 而不是 null
      announcement: group.announcement ?? undefined, // 将 null 转为 undefined 以匹配可选属性
      isMuteAll: group.isMuteAll,
    };
  }

  // =================================================================
  //  Action 6: Disband Group (解散群) [New]
  // =================================================================
  async disbandGroup(operatorId: string, conversationId: string) {
    await this._checkPermission(operatorId, conversationId, [
      ChatMemberRole.OWNER,
    ]);

    // 软删除: status = 0
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 0 },
    });

    //  Emit Event
    this.eventEmitter.emit(
      CHAT_GROUP_EVENTS.GROUP_DISBANDED,
      new GroupDisbandedEvent(conversationId, operatorId, Date.now()),
    );

    return { success: true };
  }

  // =================================================================
  //  Action 7: Leave Group (主动退群) [New]
  // =================================================================
  async leaveGroup(userId: string, conversationId: string) {
    // 检查是否在群里
    const member = await this.prisma.chatMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw new NotFoundException('Not a member');

    // 群主不能直接退群，必须先转让或解散
    if (member.role === ChatMemberRole.OWNER) {
      throw new ForbiddenException(
        'Owner cannot leave group directly. Please transfer ownership or disband group.',
      );
    }

    await this.prisma.chatMember.delete({
      where: { conversationId_userId: { conversationId, userId } },
    });

    // 系统消息
    // 注意：主动退群有时候不需要发系统消息打扰大家，看产品需求。这里暂不发系统灰条，只发 Socket 更新列表。

    //  Emit Event
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
    tx: any,
    conversationId: string,
    content: string,
  ) {
    const conv = await tx.conversation.update({
      where: { id: conversationId },
      data: {
        lastMsgSeqId: { increment: 1 },
        lastMsgContent: content,
        lastMsgType: 99, // SYSTEM
        lastMsgTime: new Date(),
      },
      select: { lastMsgSeqId: true },
    });

    return await tx.chatMessage.create({
      data: {
        conversationId,
        senderId: null,
        type: 99,
        content,
        seqId: conv.lastMsgSeqId,
      },
    });
  }
}
