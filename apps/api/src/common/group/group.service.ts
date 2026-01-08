import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { GroupListForTreasureDto } from '@api/common/group/dto/group-list-for-treasure.dto';
import { WalletService } from '@api/client/wallet/wallet.service';
import {
  ORDER_STATUS,
  PAY_STATUS,
  GROUP_STATUS,
  IS_OWNER,
  REFUND_STATUS,
} from '@lucky/shared';
import { DistributedLock } from '@api/common/decorators/distributed-lock.decorator';
import { RedisLockService } from '@api/common/redis/redis-lock.service';

type Tx = Prisma.TransactionClient | PrismaService;

@Injectable()
export class GroupService {
  private readonly logger = new Logger(GroupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    public readonly lockService: RedisLockService,
  ) {}

  private orm(tx?: Tx) {
    return (tx ?? this.prisma) as Tx;
  }

  /**
   * 组团逻辑：- create or join
   * - 传了 groupId：尝试加团（满员/状态不对则报错） - join group if groupId provided (error if full/inactive)
   * - 没传 groupId：自动开团 + 自己进成员表 - create group + add self as member if no groupId
   *
   * 注意：tx 一定是外面传进来的同一个事务 client - tx must be the same transaction client passed from outside
   */

  async joinOrCreateGroup(
    params: {
      userId: string;
      treasureId: string;
      groupId?: string | null;
      orderId: string;
    },
    tx?: Tx,
  ): Promise<{
    finalGroupId: string | null;
    isOwner: number;
    alreadyInGroup: boolean;
  }> {
    const db = this.orm(tx);

    const { userId, treasureId, groupId, orderId } = params;
    // 场景 A: 加入现有的团 (拼团)
    if (groupId) {
      // 1. 先查团的信息
      const group = await db.treasureGroup.findUnique({
        where: { groupId },
        select: {
          treasureId: true,
          groupStatus: true,
          maxMembers: true,
          currentMembers: true,
          expireAt: true,
          version: true,
        },
      });

      if (!group || group.treasureId !== treasureId) {
        throw new NotFoundException('Group not found for this treasure');
      }

      if (group.groupStatus !== GROUP_STATUS.ACTIVE) {
        throw new BadRequestException('Group is not active (expired or full)');
      }

      if (new Date() > group.expireAt) {
        throw new BadRequestException('Group has expired');
      }

      if (group.currentMembers >= group.maxMembers) {
        throw new BadRequestException('Group is already full');
      }

      // 4 核心：乐观锁更新 (CAS - Compare And Swap)
      // 只有当 version 等于我刚才读到的 version 时，才执行更新
      const updateResult = await tx?.treasureGroup.updateMany({
        where: {
          groupId: groupId,
          version: group.version, // 乐观锁版本号
          currentMembers: { lt: group.maxMembers },
        },
        data: {
          currentMembers: { increment: 1 }, //再一次兜底防止超员
          version: { increment: 1 }, // 版本号+1
        },
      });

      // 没有行被更新，说明 version 不对（被并发改过）或满员
      if (!updateResult || updateResult.count === 0) {
        this.logger.warn(
          `Concurrency conflict for group ${groupId}, rolling back.`,
        );
        throw new BadRequestException(
          'Group is full or has been updated, please try again',
        );
      }

      // 5. 写入成员记录
      await tx?.treasureGroupMember.create({
        data: {
          groupId,
          userId,
          isOwner: IS_OWNER.NO,
          orderId,
          memberType: 0,
        },
      });

      // 6. 判断是否刚刚满员 -> 触发成团成功
      // 注意：这里用 (currentMembers + 1) 判断，因为刚才内存里的 group 还是旧数据
      // 但其实最稳妥的是看 maxMembers
      if (group.currentMembers + 1 >= group.maxMembers) {
        await this.handleGroupSuccess(groupId, db);
      }

      return {
        finalGroupId: groupId,
        isOwner: IS_OWNER.NO,
        alreadyInGroup: false,
      };
    } else {
      // 场景 B: 创建新团 (开团)
      // 1. 查商品配置 (几人团？多久过期？)
      const treasure = await db.treasure.findUnique({
        where: { treasureId },
      });
      if (!treasure) {
        throw new BadRequestException('Treasure not found');
      }

      const groupSize = treasure.groupSize || 5; // 默认5人团
      const duration = (treasure.groupTimeLimit || 86400) * 1000; // 秒转毫秒

      // 2. 创建团
      const newGroup = await db.treasureGroup.create({
        data: {
          treasureId,
          creatorId: userId,
          maxMembers: groupSize,
          currentMembers: 1, //自己先占一个名额
          groupStatus: GROUP_STATUS.ACTIVE,
          version: 1,
          expireAt: new Date(Date.now() + duration),
        },
      });

      // 3. 写入团长记录
      await db.treasureGroupMember.create({
        data: {
          groupId: newGroup.groupId,
          userId,
          isOwner: IS_OWNER.YES,
          orderId,
          memberType: 0,
        },
      });
      return {
        finalGroupId: newGroup.groupId,
        isOwner: 1,
        alreadyInGroup: false,
      };
    }
  }

  /**
   * 私有方法：处理成团成功逻辑
   * 1. 改变状态
   * 2. (可选) 触发发货、抽奖或通知
   */

  private async handleGroupSuccess(groupId: string, db: Tx) {
    this.logger.log(`Group ${groupId} success!`);
    await db.treasureGroup.update({
      where: { groupId },
      data: {
        groupStatus: GROUP_STATUS.SUCCESS,
        successAt: new Date(),
        endedAt: new Date(),
      },
    });

    // TODO: 触发后续逻辑，如发货、抽奖、通知等
  }

  // 组团列表
  async listGroupForTreasure(dto: GroupListForTreasureDto) {
    const { treasureId, page, pageSize } = dto;

    const [total, groups] = await this.prisma.$transaction([
      this.prisma.treasureGroup.count({
        where: { treasureId, groupStatus: GROUP_STATUS.ACTIVE },
      }),
      this.prisma.treasureGroup.findMany({
        where: { treasureId, groupStatus: GROUP_STATUS.ACTIVE },
        // 优先展示快过期的，增加紧迫感
        orderBy: [{ expireAt: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          creator: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
          members: {
            orderBy: [{ isOwner: 'desc' }, { joinedAt: 'asc' }],
            // 每个组只取前 8 个成员预览；顺序：团长在前，其余按加入时间
            take: 8,
            include: {
              user: {
                select: {
                  id: true,
                  nickname: true,
                  avatar: true,
                },
              },
            },
          },
          _count: { select: { members: true } },
        },
      }),
    ]);

    return {
      page,
      pageSize,
      total,
      list: groups,
    };
  }

  // 查找团对应的成员
  async listGroupMembers(
    groupId: string,
    params: {
      page: number;
      pageSize: number;
    },
  ) {
    const { page, pageSize } = params;

    // check groupId exists
    const group = await this.prisma.treasureGroup.findUnique({
      where: { groupId },
      select: { groupId: true },
    });

    // group not found, return empty list
    if (!group) {
      return {
        page,
        pageSize,
        total: 0,
        list: [],
      };
    }

    // fetch members
    const [count, members] = await this.prisma.$transaction([
      this.prisma.treasureGroupMember.count({ where: { groupId } }),
      this.prisma.treasureGroupMember.findMany({
        where: { groupId },
        orderBy: [{ isOwner: 'desc' }, { joinedAt: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      }),
    ]);
    return {
      page,
      pageSize,
      total: count,
      list: members,
    };
  }

  /**
   *  定时任务：每分钟执行一次
   * 扫描过期团，触发自动退款
   * throwOnFail = false，抢不到锁就跳过，不报错
   */
  @DistributedLock('group:expired:handler', 3000, false)
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredGroups() {
    // 1. 找出所有过期且未处理的团
    const expiredGroups = await this.prisma.treasureGroup.findMany({
      where: {
        groupStatus: GROUP_STATUS.ACTIVE, // 仍然是进行中的
        expireAt: { lt: new Date() }, // 时间：已经过期
      },
      take: 50, // 每次处理 500个，防止一次性数据量过大
      select: { groupId: true },
    });
    if (expiredGroups.length === 0) {
      return;
    }
    this.logger.log(`Found ${expiredGroups.length} expired groups to process.`);

    // 2. 逐个处理 (使用 Promise.allSettled 防止一个报错卡死整个循环)
    await Promise.allSettled(
      expiredGroups.map((g) => this.processGroupFailure(g.groupId)),
    );
  }

  /**
   * 处理单个团的失败流程 (原子性操作)
   */
  private async processGroupFailure(groupId: string) {
    try {
      await this.prisma.$transaction(async (tx) => {
        // A. 二次确认状态 (防止在查出来的毫秒间，正好有人凑齐了)
        const group = await tx.treasureGroup.findUnique({
          where: { groupId },
        });

        if (!group || group.groupStatus !== GROUP_STATUS.ACTIVE) {
          return;
        }

        this.logger.warn(
          `Group ${groupId} failed to complete, processing refunds.`,
        );

        // B. 更新团状态为失败
        await tx.treasureGroup.update({
          where: { groupId },
          data: {
            groupStatus: GROUP_STATUS.FAILED, // 标记为失败
            endedAt: new Date(),
          },
        });

        // C. 处理退款逻辑
        const orders = await tx.order.findMany({
          where: {
            groupId,
            payStatus: PAY_STATUS.PAID,
            refundStatus: REFUND_STATUS.NO_REFUND,
          },
        });

        if (orders.length > 0) {
          this.logger.log(
            `[Cron] Refunding ${orders.length} orders for group ${groupId}`,
          );
        }

        // D. 逐个退款 (在同一个事务里处理，或者分离)
        // 建议：直接在这里调退款，确保状态一致性
        for (const order of orders) {
          // 调用退款服务
          await this.refundSingleOrder(order, tx);
        }
      });
    } catch (e: any) {
      this.logger.error(
        `Error processing failure for group ${groupId}: ${e.message}`,
      );
    }
  }

  /**
   * 单笔订单退款逻辑
   */

  private async refundSingleOrder(order: any, tx: Tx) {
    // 防止重复退款
    if (order.refundStatus !== REFUND_STATUS.NO_REFUND) return;

    const cashRefund = new Prisma.Decimal(order.finalAmount);
    const coinRefund = new Prisma.Decimal(order.coinUsed || 0);

    // 1. 退现金 (如果有)
    if (cashRefund.gt(0)) {
      await this.wallet.creditCash(
        {
          userId: order.userId,
          amount: cashRefund,
          related: { id: order.orderId, type: 'REFUND_GROUP_FAIL' },
          desc: 'Refund for failed group purchase',
        },
        tx,
      );
    }

    // 2. 退金币 (如果有)
    if (coinRefund.gt(0)) {
      await this.wallet.creditCoin(
        {
          userId: order.userId,
          coins: coinRefund,
          related: { id: order.orderId, type: 'REFUND_GROUP_FAIL' },
          desc: 'Refund of coins for failed group purchase',
        },
        tx,
      );
    }

    // 3. 更新订单退款状态
    await tx.order.update({
      where: { orderId: order.orderId },
      data: {
        orderStatus: ORDER_STATUS.CANCELED, // 取消订单
        refundStatus: REFUND_STATUS.REFUNDED, // 标记为已退款
        refundReason: 'Group purchase failed, automatic refund issued',
        refundAmount: cashRefund,
        refundedAt: new Date(),
        refundAuditedBy: 'SYSTEM_CRON', // 系统自动
      },
    });
  }
}
