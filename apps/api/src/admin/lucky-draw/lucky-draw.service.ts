import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CreatePrizeDto } from './dto/create-prize.dto';
import { UpdatePrizeDto } from './dto/update-prize.dto';
import { QueryResultsDto } from './dto/query-results.dto';

@Injectable()
export class AdminLuckyDrawService {
  constructor(private readonly prisma: PrismaService) {}

  // ================================================================
  // 活动 CRUD
  // ================================================================

  async listActivities() {
    const list = await this.prisma.luckyDrawActivity.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        prizes: { orderBy: { sortOrder: 'asc' } },
        treasure: { select: { treasureName: true } },
      },
    });
    return {
      list: list.map((a) => ({
        id: a.id,
        createdAt: a.createdAt.getTime(),
        title: a.title,
        description: a.description,
        treasureId: a.treasureId,
        treasureName: a.treasure?.treasureName ?? null,
        status: a.status,
        startAt: a.startAt?.getTime() ?? null,
        endAt: a.endAt?.getTime() ?? null,
        prizes: a.prizes.map((p) => ({
          id: p.id,
          activityId: p.activityId,
          prizeType: p.prizeType,
          prizeName: p.prizeName,
          couponId: p.couponId,
          couponName: null as string | null,
          prizeValue: p.prizeValue?.toNumber() ?? null,
          probability: p.probability.toNumber(),
          stock: p.stock,
          sortOrder: p.sortOrder,
        })),
      })),
      total: list.length,
    };
  }

  async getActivity(id: string) {
    const a = await this.prisma.luckyDrawActivity.findUnique({
      where: { id },
      include: {
        prizes: {
          orderBy: { sortOrder: 'asc' },
          include: { coupon: { select: { couponName: true } } },
        },
        treasure: { select: { treasureName: true } },
      },
    });
    if (!a) throw new NotFoundException('Activity not found');
    return {
      id: a.id,
      createdAt: a.createdAt.getTime(),
      title: a.title,
      description: a.description,
      treasureId: a.treasureId,
      treasureName: a.treasure?.treasureName ?? null,
      status: a.status,
      startAt: a.startAt?.getTime() ?? null,
      endAt: a.endAt?.getTime() ?? null,
      prizes: a.prizes.map((p) => ({
        id: p.id,
        activityId: p.activityId,
        prizeType: p.prizeType,
        prizeName: p.prizeName,
        couponId: p.couponId,
        couponName: p.coupon?.couponName ?? null,
        prizeValue: p.prizeValue?.toNumber() ?? null,
        probability: p.probability.toNumber(),
        stock: p.stock,
        sortOrder: p.sortOrder,
      })),
    };
  }

  async createActivity(dto: CreateActivityDto) {
    const a = await this.prisma.luckyDrawActivity.create({
      data: {
        title: dto.title,
        description: dto.description,
        treasureId: dto.treasureId ?? null,
        status: dto.status ?? 1,
        startAt: dto.startAt ? new Date(dto.startAt) : null,
        endAt: dto.endAt ? new Date(dto.endAt) : null,
      },
    });
    return { id: a.id };
  }

  async updateActivity(id: string, dto: UpdateActivityDto) {
    await this.requireActivity(id);
    await this.prisma.luckyDrawActivity.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.treasureId !== undefined && { treasureId: dto.treasureId }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.startAt !== undefined && {
          startAt: dto.startAt ? new Date(dto.startAt) : null,
        }),
        ...(dto.endAt !== undefined && {
          endAt: dto.endAt ? new Date(dto.endAt) : null,
        }),
      },
    });
    return { success: true };
  }

  async deleteActivity(id: string) {
    await this.requireActivity(id);
    await this.prisma.luckyDrawActivity.delete({ where: { id } });
    return { success: true };
  }

  // ================================================================
  // 奖品 CRUD
  // ================================================================

  async listPrizes(activityId: string) {
    const list = await this.prisma.luckyDrawPrize.findMany({
      where: { activityId },
      orderBy: { sortOrder: 'asc' },
      include: { coupon: { select: { couponName: true } } },
    });
    return {
      list: list.map((p) => ({
        id: p.id,
        activityId: p.activityId,
        prizeType: p.prizeType,
        prizeName: p.prizeName,
        couponId: p.couponId,
        couponName: p.coupon?.couponName ?? null,
        prizeValue: p.prizeValue?.toNumber() ?? null,
        probability: p.probability.toNumber(),
        stock: p.stock,
        sortOrder: p.sortOrder,
      })),
      total: list.length,
    };
  }

  async createPrize(dto: CreatePrizeDto) {
    await this.requireActivity(dto.activityId);
    await this.validateProbabilitySum(dto.activityId, null, dto.probability);

    const p = await this.prisma.luckyDrawPrize.create({
      data: {
        activityId: dto.activityId,
        prizeType: dto.prizeType,
        prizeName: dto.prizeName,
        couponId: dto.couponId ?? null,
        prizeValue:
          dto.prizeValue != null ? new Prisma.Decimal(dto.prizeValue) : null,
        probability: new Prisma.Decimal(dto.probability),
        stock: dto.stock ?? -1,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    return { id: p.id };
  }

  async updatePrize(prizeId: string, dto: UpdatePrizeDto) {
    const prize = await this.prisma.luckyDrawPrize.findUnique({
      where: { id: prizeId },
    });
    if (!prize) throw new NotFoundException('Prize not found');

    if (dto.probability !== undefined) {
      await this.validateProbabilitySum(
        prize.activityId,
        prizeId,
        dto.probability,
      );
    }

    await this.prisma.luckyDrawPrize.update({
      where: { id: prizeId },
      data: {
        ...(dto.prizeType !== undefined && { prizeType: dto.prizeType }),
        ...(dto.prizeName !== undefined && { prizeName: dto.prizeName }),
        ...(dto.couponId !== undefined && { couponId: dto.couponId }),
        ...(dto.prizeValue !== undefined && {
          prizeValue:
            dto.prizeValue != null ? new Prisma.Decimal(dto.prizeValue) : null,
        }),
        ...(dto.probability !== undefined && {
          probability: new Prisma.Decimal(dto.probability),
        }),
        ...(dto.stock !== undefined && { stock: dto.stock }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
    return { success: true };
  }

  async deletePrize(prizeId: string) {
    const prize = await this.prisma.luckyDrawPrize.findUnique({
      where: { id: prizeId },
    });
    if (!prize) throw new NotFoundException('Prize not found');
    await this.prisma.luckyDrawPrize.delete({ where: { id: prizeId } });
    return { success: true };
  }

  // ================================================================
  // 抽奖结果列表
  // ================================================================

  async listResults(dto: QueryResultsDto) {
    const { page = 1, pageSize = 20, activityId, userId } = dto;

    const where: Prisma.LuckyDrawResultWhereInput = {};
    if (userId) where.userId = userId;
    if (activityId) {
      where.ticket = { activityId };
    }

    const [total, list] = await Promise.all([
      this.prisma.luckyDrawResult.count({ where }),
      this.prisma.luckyDrawResult.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { nickname: true, avatar: true } },
          prize: {
            select: { prizeName: true, prizeType: true, activityId: true },
          },
          ticket: {
            select: {
              activity: { select: { title: true } },
              orderId: true,
            },
          },
        },
      }),
    ]);

    return {
      list: list.map((r) => ({
        id: r.id,
        createdAt: r.createdAt.getTime(),
        userId: r.userId,
        userNickname: r.user.nickname,
        userAvatar: r.user.avatar,
        prizeId: r.prizeId,
        prizeName: r.prize.prizeName,
        prizeType: r.prize.prizeType,
        activityId: r.prize.activityId,
        activityTitle: r.ticket.activity?.title ?? null,
        orderId: r.ticket.orderId,
        prizeSnapshot: r.prizeSnapshot,
      })),
      total,
      page,
      pageSize,
    };
  }

  // ================================================================
  // 私有辅助
  // ================================================================

  private async requireActivity(id: string) {
    const a = await this.prisma.luckyDrawActivity.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!a) throw new NotFoundException('Activity not found');
  }

  /** 验证同一活动的概率总和不超过 100 */
  private async validateProbabilitySum(
    activityId: string,
    excludePrizeId: string | null,
    newProbability: number,
  ) {
    const agg = await this.prisma.luckyDrawPrize.aggregate({
      _sum: { probability: true },
      where: {
        activityId,
        ...(excludePrizeId ? { id: { not: excludePrizeId } } : {}),
      },
    });
    const existing = agg._sum.probability?.toNumber() ?? 0;
    if (existing + newProbability > 100) {
      throw new BadRequestException(
        `Probability sum would exceed 100 (current: ${existing}, adding: ${newProbability})`,
      );
    }
  }
}
