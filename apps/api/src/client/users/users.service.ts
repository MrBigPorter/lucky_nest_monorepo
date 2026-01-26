import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { md5 } from '@api/common/crypto.util';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // 创建新用户
  async create(data: CreateUserDto) {
    const phone = data.phone.trim();
    const phoneMd5 = md5(phone);

    return this.prisma.user.create({
      data: {
        phone: data.phone,
        phoneMd5,
        nickname:
          data.nickname ?? `pl_${Math.random().toString().slice(2, 10)}`,
      },
    });
  }

  // 获取用户的联系人列表
  async getContacts(userId: string) {
    const friendships = await this.prisma.friend.findMany({
      where: {
        userId: userId,
        status: 1,
      },
      include: {
        friend: {
          select: { id: true, nickname: true, avatar: true, phone: true },
        },
      },
    });
    return friendships.map((friendship) => friendship.friend);
  }

  // 2. 添加好友：实现双向好友关系逻辑
  async addFriend(userId: string, friendId: string) {
    if (userId === friendId)
      throw new ForbiddenException('Cannot add yourself');
    return this.prisma.$transaction([
      // 插入 我的好友列表 记录
      this.prisma.friend.upsert({
        where: { userId_friendId: { userId, friendId } },
        create: { userId, friendId, status: 1 },
        update: { status: 1 },
      }),
      // 插入 对方好友列表 记录 (实现双向互加)
      this.prisma.friend.upsert({
        where: { userId_friendId: { userId: friendId, friendId: userId } },
        create: { userId: friendId, friendId: userId, status: 1 },
        update: { status: 1 },
      }),
    ]);
  }
}
