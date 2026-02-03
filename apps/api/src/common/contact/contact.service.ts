import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { EventsGateway } from '@api/common/events/events.gateway';
import { AddFriendDto } from '@api/common/contact/dto/contact.dto';
import {
  FRIEND_REQUEST_STATUS,
  FRIEND_SHIP_STATUS,
  RELATIONSHIP_STATUS,
  SocketEvents, // 确保引入了最新的常量定义
} from '@lucky/shared';
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

    const targetUser = await this.prisma.user.findUnique({
      where: { id: friendId },
    });

    if (!targetUser) {
      throw new NotFoundException(
        'The user you are trying to add does not exist.',
      );
    }

    const existingFriend = await this.prisma.friend.findUnique({
      where: { userId_friendId: { userId, friendId } },
    });
    if (
      existingFriend &&
      existingFriend.status === FRIEND_SHIP_STATUS.FRIENDS
    ) {
      throw new BadRequestException('You are already friends with this user.');
    }

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

    /**
     * 修改点 1: 修改好友申请的 Socket 通知逻辑
     * 不再直接使用 .emit('contact_apply')，而是通过统一的 dispatch 管道
     */
    this.eventsGateway.dispatch(
      `user_${friendId}`,
      SocketEvents.CONTACT_APPLY,
      {
        applicantId: userId,
        reason,
      },
    );

    return { success: true };
  }

  /**
   * Get friend requests
   */
  async getFriendRequests(userId: string) {
    const requests = await this.prisma.friendRequest.findMany({
      where: {
        toUserId: userId,
        status: FRIEND_REQUEST_STATUS.PENDING,
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

    return requests.map((r) => ({
      id: r.fromUser.id,
      nickname: r.fromUser.nickname,
      avatar: r.fromUser.avatar,
      requestTime: r.createdAt.getTime(),
      reason: r.reason,
    }));
  }

  /**
   * Handle request
   */
  async handleFriendRequest(userId: string, dto: HandleContactDto) {
    const { targetId, accept } = dto;

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

    if (!accept) {
      await this.prisma.friendRequest.update({
        where: { id: request.id },
        data: { status: FRIEND_REQUEST_STATUS.REJECTED },
      });
      return { success: true, action: 'rejected' };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.friendRequest.update({
        where: { id: request.id },
        data: { status: FRIEND_REQUEST_STATUS.ACCEPTED },
      });

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

    /**
     *  修改点 2: 修改同意好友申请的 Socket 通知逻辑
     * 统一走 dispatch，确保前端 SocketService 能在对应的 type 中处理逻辑
     */
    this.eventsGateway.dispatch(
      `user_${targetId}`,
      SocketEvents.CONTACT_ACCEPT,
      {
        friendId: userId,
      },
    );

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
   */
  async searchUsers(myUserId: string, dto: { keyword: string }) {
    const users = await this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: myUserId } },
          { isRobot: false },
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
      select: { id: true, nickname: true, avatar: true, phone: true },
    });

    if (users.length === 0) return [];

    const targetUserIds = users.map((u) => u.id);
    const friends = await this.prisma.friend.findMany({
      where: {
        userId: myUserId,
        friendId: { in: targetUserIds },
        status: FRIEND_SHIP_STATUS.FRIENDS,
      },
      select: { friendId: true },
    });

    const friendIdSet = new Set(friends.map((f) => f.friendId));
    const nonFriendIds = targetUserIds.filter((id) => !friendIdSet.has(id));

    let sentRequestSet = new Set<string>();
    if (nonFriendIds.length > 0) {
      const sentRequests = await this.prisma.friendRequest.findMany({
        where: {
          fromUserId: myUserId,
          toUserId: { in: nonFriendIds },
          status: FRIEND_REQUEST_STATUS.PENDING,
        },
        select: { toUserId: true },
      });
      sentRequestSet = new Set(sentRequests.map((r) => r.toUserId));
    }

    return users.map((user) => {
      let status = RELATIONSHIP_STATUS.STRANGER;

      if (friendIdSet.has(user.id)) {
        status = RELATIONSHIP_STATUS.FRIEND;
      } else if (sentRequestSet.has(user.id)) {
        status = RELATIONSHIP_STATUS.SENT;
      }

      return {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        status: status,
      };
    });
  }
}
