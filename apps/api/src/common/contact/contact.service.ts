import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { EventsGateway } from '@api/common/events/events.gateway';
import { AddFriendDto } from '@api/common/contact/dto/contact.dto';
import { FRIEND_REQUEST_STATUS, FRIEND_SHIP_STATUS } from '@lucky/shared';
import { SocketEvents } from '@lucky/shared';
import { HandleContactDto } from '@api/common/contact/dto/handle-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Add friend request
   */
  async addFriend(userId: string, dto: AddFriendDto) {
    const { friendId, reason } = dto;

    if (friendId === userId) {
      throw new BadRequestException('You cannot add yourself as a friend.');
    }

    // 1. Check target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: friendId },
    });

    if (!targetUser) {
      throw new NotFoundException(
        'The user you are trying to add does not exist.',
      );
    }

    // 2. Check existing friendship
    const existingFriend = await this.prisma.friend.findUnique({
      where: { userId_friendId: { userId, friendId } },
    });
    if (
      existingFriend &&
      existingFriend.status === FRIEND_SHIP_STATUS.FRIENDS
    ) {
      throw new BadRequestException('You are already friends with this user.');
    }

    // 3. Upsert Request
    await this.prisma.friendRequest.upsert({
      where: {
        fromUserId_toUserId: { fromUserId: userId, toUserId: friendId },
      },
      update: {
        status: FRIEND_REQUEST_STATUS.PENDING,
        reason,
        updatedAt: new Date(),
      },
      create: {
        fromUserId: userId,
        toUserId: friendId,
        reason,
        status: FRIEND_REQUEST_STATUS.PENDING,
      },
    });

    // 4. Socket Notification
    this.eventsGateway.server
      .to(`user_${friendId}`)
      .emit(SocketEvents.CONTACT_APPLY, {
        applicantId: userId,
        reason,
      });

    return { success: true };
  }

  /**
   * Get friend requests (Fixed Mapping)
   */
  async getFriendRequests(userId: string) {
    const requests = await this.prisma.friendRequest.findMany({
      where: {
        toUserId: userId,
        status: FRIEND_REQUEST_STATUS.PENDING, // Only pending requests
      },
      include: {
        fromUser: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 关键修复：手动映射 Prisma 数据结构 -> DTO 结构
    return requests.map((r) => ({
      id: r.fromUser.id,
      nickname: r.fromUser.nickname,
      avatar: r.fromUser.avatar,
      requestTime: r.createdAt.getTime(), // Date -> timestamp
      reason: r.reason,
    }));
  }

  /**
   * Handle request (Fixed Logic)
   */
  async handleFriendRequest(userId: string, dto: HandleContactDto) {
    const { targetId, accept } = dto;

    // 1. Find the request
    const request = await this.prisma.friendRequest.findUnique({
      where: {
        fromUserId_toUserId: { fromUserId: targetId, toUserId: userId },
      },
    });

    if (!request || request.status !== FRIEND_REQUEST_STATUS.PENDING) {
      throw new NotFoundException(
        'Friend request not found or already handled.',
      );
    }

    //  关键修复 2：处理拒绝逻辑 (accept 是 boolean)
    if (!accept) {
      await this.prisma.friendRequest.update({
        where: { id: request.id },
        data: { status: FRIEND_REQUEST_STATUS.REJECTED },
      });
      return { success: true, action: 'rejected' }; // 必须 Return，否则会跑下面的同意逻辑
    }

    // 关键修复 3：处理同意逻辑 (事务 + 双向好友)
    await this.prisma.$transaction(async (tx) => {
      // A. Update Request Status
      await tx.friendRequest.update({
        where: { id: request.id },
        data: { status: FRIEND_REQUEST_STATUS.ACCEPTED },
      });

      // B. Create Bi-directional Friendship (双向写入)

      // 1. Me -> Him
      await tx.friend.upsert({
        where: { userId_friendId: { userId, friendId: targetId } },
        create: {
          userId,
          friendId: targetId,
          status: FRIEND_SHIP_STATUS.FRIENDS,
          remark: '',
        },
        update: { status: FRIEND_SHIP_STATUS.FRIENDS },
      });

      // 2. Him -> Me (User 表反向关联)
      await tx.friend.upsert({
        where: { userId_friendId: { userId: targetId, friendId: userId } },
        create: {
          userId: targetId,
          friendId: userId,
          status: FRIEND_SHIP_STATUS.FRIENDS,
          remark: '',
        },
        update: { status: FRIEND_SHIP_STATUS.FRIENDS },
      });
    });

    // 4. Socket Notification
    this.eventsGateway.server
      .to(`user_${targetId}`)
      .emit(SocketEvents.CONTACT_ACCEPT, {
        friendId: userId,
      });

    return { success: true, action: 'accepted' };
  }

  /**
   * Get contacts
   */
  async getContacts(userId: string) {
    const friends = await this.prisma.friend.findMany({
      where: {
        userId,
        status: FRIEND_SHIP_STATUS.FRIENDS,
      },
      include: {
        friend: {
          select: { id: true, nickname: true, avatar: true, phone: true },
        },
      },
      orderBy: { friend: { nickname: 'asc' } },
    });

    return friends.map((f) => ({
      id: f.friend.id,
      nickname: f.remark || f.friend.nickname,
      avatar: f.friend.avatar,
      phone: f.friend.phone,
    }));
  }
  /**
   * Search users
   * @param myUserId
   * @param dto
   */
  async searchUsers(myUserId: string, dto: { keyword: string }) {
    return this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: myUserId } }, // 排除自己
          {
            OR: [
              { nickname: { contains: dto.keyword, mode: 'insensitive' } },
              { phone: { contains: dto.keyword } },
              { id: { equals: dto.keyword } }, // 支持直接搜 ID
            ],
          },
        ],
      },
      take: 20,
      select: { id: true, nickname: true, avatar: true, phone: true },
    });
  }
}
