import { Injectable } from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { TreasureQueryDto } from '@api/client/treasure/dto/treasure-query.dto';
import { RedisService } from '@api/common/redis/redis.service';
import { TreasureFilterType } from '@lucky/shared';
import { Prisma } from '@prisma/client';
import { Max } from 'class-validator';

@Injectable()
export class TreasureService {
  constructor(
    private readonly prisma: PrismaService,
    public readonly redisService: RedisService,
  ) {}

  // 统一计算购买进度，返回 0~100，保留两位小数
  private calcProgressPercent(
    seqShelvesQuantity: number | null | undefined,
    seqBuyQuantity: number | null | undefined,
  ): number {
    const total = seqShelvesQuantity ?? 0;
    const bought = seqBuyQuantity ?? 0;

    if (total <= 0) return 0;

    // 保留两位小数，比如 37.52
    return Math.round((bought * 10000) / total) / 100;
  }

  // 商品列表
  async list(query: TreasureQueryDto) {
    const { page, pageSize, q, categoryId, state, filterType } = query;

    const now = new Date();

    const where: any = {};

    where.state = typeof state === 'number' ? state : 1;

    if (q?.trim()) {
      where.OR = [
        { treasureName: { contains: q, mode: 'insensitive' } },
        { productName: { contains: q, mode: 'insensitive' } },
      ];
    }

    // 按分类筛选
    if (categoryId) {
      where.categories = {
        some: {
          categoryId,
        },
      };
    }

    if (filterType === TreasureFilterType.PRE_SALE) {
      //只看预售：开始时间 > 现在
      where.salesStartAt = {
        gt: now,
      };
    }

    if (filterType === TreasureFilterType.ON_SALE) {
      //  只看正在卖：
      // (开始时间为空 OR 开始时间 <= 现在) AND (未过期)
      where.AND = [
        {
          OR: [
            { salesStartAt: { lte: now } }, // 或者 已经开始了
            { salesStartAt: null }, // 没有设置开始时间(立即开售)
          ],
        },
        {
          OR: [
            { salesEndAt: null }, // 没有设置结束时间(永久售卖)
            { salesEndAt: { gt: now } }, // 或者 还没有结束
          ],
        },
      ];
    }

    // 5. 排序优化
    // 如果是查预售，按“开始时间”升序排（最近开始的排前面）
    // 否则按创建时间倒序
    const orderBy: Prisma.TreasureOrderByWithRelationInput = {};
    if (filterType === TreasureFilterType.PRE_SALE) {
      orderBy.salesStartAt = 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }
    const [total, items] = await this.prisma.$transaction([
      this.prisma.treasure.count({ where }),
      this.prisma.treasure.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          treasureId: true,
          treasureSeq: true,
          treasureName: true,
          productName: true,
          treasureCoverImg: true,
          unitAmount: true,
          seqShelvesQuantity: true,
          seqBuyQuantity: true,
          lotteryMode: true,
          lotteryTime: true,
          state: true,
          cashState: true,
          charityAmount: true,
          groupMaxNum: true,
          imgStyleType: true,
          minBuyQuantity: true,
          maxUnitCoins: true,
          maxUnitAmount: true,
          maxPerBuyQuantity: true,
          groupSize: true,
          salesStartAt: true,
          salesEndAt: true,

          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const mapped = items.map((it) => ({
      ...it,
      buyQuantityRate: this.calcProgressPercent(
        it.seqShelvesQuantity,
        it.seqBuyQuantity,
      ),
      categories: it.categories.map((c) => c.category),
      // 虽然前端可以算，但后端给标记更稳
      statusTag:
        it.salesStartAt && it.salesStartAt > now ? 'PRE_SALE' : 'ON_SALE',
    }));

    return {
      page,
      pageSize,
      total,
      list: mapped,
    };
  }

  // 详情
  async detail(id: string) {
    const result = await this.prisma.treasure.findUnique({
      where: { treasureId: id },
      select: {
        treasureId: true,
        treasureSeq: true,
        treasureName: true,
        productName: true,
        treasureCoverImg: true,
        unitAmount: true,
        seqShelvesQuantity: true,
        seqBuyQuantity: true,
        lotteryMode: true,
        lotteryTime: true,
        state: true,
        cashState: true,
        charityAmount: true,
        groupMaxNum: true,
        imgStyleType: true,
        ruleContent: true,
        costAmount: true,
        mainImageList: true,
        desc: true,
        minBuyQuantity: true,
        maxUnitCoins: true,
        maxUnitAmount: true,
        maxPerBuyQuantity: true,

        shippingType: true,
        groupSize: true,
        salesStartAt: true,
        salesEndAt: true,
        bonusConfig: true,
      },
    });

    if (!result) {
      throw new Error('Treasure not found');
    }

    const now = new Date(); // 获取当前时间

    const progressPercent = this.calcProgressPercent(
      result.seqShelvesQuantity,
      result.seqBuyQuantity,
    );

    return {
      ...result,
      buyQuantityRate: progressPercent,
      statusTag:
        result.salesStartAt && result.salesStartAt > now
          ? 'PRE_SALE'
          : 'ON_SALE',
    };
  }

  /**
   * 获取商品的最新状态（库存、价格、上下架、过期等）
   * @param id
   */
  async getStatus(id: string) {
    const result = await this.prisma.treasure.findUnique({
      where: { treasureId: id },
      select: {
        treasureId: true,
        state: true, // 上下架状态
        seqShelvesQuantity: true, // 总库存
        seqBuyQuantity: true, // 已买数量 (用于计算剩余库存)
        unitAmount: true, // 价格 (防止价格变动)
        salesEndAt: true, // 检查是否过期
        groupSize: true, // 拼团人数状态
      },
    });

    if (!result) {
      throw new Error('Treasure not found');
    }

    // 实时计算最新的进度/库存
    const stockLeft = (result?.seqShelvesQuantity ?? 0) - result.seqBuyQuantity;
    const isSoldOut = stockLeft <= 0;
    return {
      id: result.treasureId,
      stock: Math.max(1, stockLeft), // 剩余库存
      price: result.unitAmount,
      isSoldOut: isSoldOut, // 直接告诉前端是否卖完
      state: result.state, // 1=上架, 0=下架
      isExpired: result.salesEndAt && new Date() > result.salesEndAt,
    };
  }
}
