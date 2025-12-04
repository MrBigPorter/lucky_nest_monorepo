import { Injectable } from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { TreasureQueryDto } from '@api/client/treasure/dto/treasure-query.dto';

@Injectable()
export class TreasureService {
  constructor(private readonly prisma: PrismaService) {}

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
    const { page, pageSize, q, categoryId, state } = query;
    const where: any = {};

    if (typeof state === 'number') where.state = state;
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

    const [total, items] = await this.prisma.$transaction([
      this.prisma.treasure.count({ where }),
      this.prisma.treasure.findMany({
        where,
        orderBy: { createdAt: 'desc' },
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
      },
    });

    if (!result) {
      throw new Error('Treasure not found');
    }

    const progressPercent = this.calcProgressPercent(
      result.seqShelvesQuantity,
      result.seqBuyQuantity,
    );

    return {
      ...result,
      buyQuantityRate: progressPercent,
    };
  }
}
