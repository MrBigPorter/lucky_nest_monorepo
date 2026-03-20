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
import { PaginateDto } from '@api/common/dto/paginate.dto';

const LUCKY_DRAW_PRIZE_TYPE = {
  COUPON: 1,
  COIN: 2,
  BALANCE: 3,
  THANKS: 4,
} as const;

@Injectable()
export class AdminLuckyDrawService {
  constructor(private readonly prisma: PrismaService) {}

  // ================================================================
  // Activity CRUD
  // ================================================================

  async createActivity(dto: CreateActivityDto) {
    this.validateTimeRange(dto.startAt, dto.endAt);
    if (dto.treasureId) {
      await this.validateTreasure(dto.treasureId);
    }

    return this.prisma.luckyDrawActivity.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        treasureId: dto.treasureId ?? null,
        status: dto.status ?? 1,
        startAt: dto.startAt ? new Date(dto.startAt) : null,
        endAt: dto.endAt ? new Date(dto.endAt) : null,
      },
    });
  }

  async listActivities(paginate: PaginateDto) {
    const { page = 1, pageSize = 20 } = paginate;
    const [total, list] = await this.prisma.$transaction([
      this.prisma.luckyDrawActivity.count(),
      this.prisma.luckyDrawActivity.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          treasure: { select: { treasureName: true } },
          _count: { select: { prizes: true, tickets: true } },
        },
      }),
    ]);

    return {
      total,
      list: list.map((item) => ({
        ...item,
        treasureName: item.treasure?.treasureName,
        prizesCount: item._count.prizes,
        ticketsCount: item._count.tickets,
      })),
      page,
      pageSize,
    };
  }

  async getActivity(id: string) {
    const activity = await this.prisma.luckyDrawActivity.findUnique({
      where: { id },
      include: {
        treasure: { select: { treasureName: true } },
        prizes: {
          orderBy: { probability: 'desc' },
          include: { coupon: { select: { couponName: true } } },
        },
      },
    });
    if (!activity) {
      throw new NotFoundException('Activity not found.');
    }
    return {
      ...activity,
      treasureName: activity.treasure?.treasureName,
      prizes: activity.prizes.map((p) => ({
        ...p,
        couponName: p.coupon?.couponName,
      })),
    };
  }

  async updateActivity(id: string, dto: UpdateActivityDto) {
    const activity = await this.requireActivity(id);
    const raw = dto as Record<string, unknown>;

    const title = this.asOptionalString(raw.title);
    const description = this.asOptionalNullableString(raw.description);
    const treasureId = this.asOptionalNullableString(raw.treasureId);
    const status = this.asOptionalNumber(raw.status);
    const startAt = this.asOptionalNullableString(raw.startAt);
    const endAt = this.asOptionalNullableString(raw.endAt);

    const nextStartAt =
      startAt === undefined
        ? activity.startAt
        : startAt === null
          ? null
          : new Date(startAt);
    const nextEndAt =
      endAt === undefined
        ? activity.endAt
        : endAt === null
          ? null
          : new Date(endAt);

    if (nextStartAt && nextEndAt && nextStartAt >= nextEndAt) {
      throw new BadRequestException('startAt must be earlier than endAt.');
    }
    if (typeof treasureId === 'string' && treasureId.length > 0) {
      await this.validateTreasure(treasureId);
    }

    const data: Prisma.LuckyDrawActivityUncheckedUpdateInput = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (treasureId !== undefined) data.treasureId = treasureId;
    if (status !== undefined) data.status = status;
    if (startAt !== undefined) data.startAt = nextStartAt;
    if (endAt !== undefined) data.endAt = nextEndAt;

    return this.prisma.luckyDrawActivity.update({
      where: { id },
      data,
    });
  }

  async deleteActivity(id: string) {
    await this.requireActivity(id);
    // Note: Deleting an activity will cascade delete prizes, tickets, and results due to schema relations.
    return this.prisma.luckyDrawActivity.delete({ where: { id } });
  }

  // ================================================================
  // Prize CRUD
  // ================================================================

  async createPrize(dto: CreatePrizeDto) {
    const { activityId, probability, prizeType, couponId, prizeValue } = dto;

    await this.requireActivity(activityId);
    await this.validateProbabilitySum(activityId, null, probability);
    this.validatePrizePayload(prizeType, couponId, prizeValue);
    if (prizeType === LUCKY_DRAW_PRIZE_TYPE.COUPON && couponId) {
      await this.validateCoupon(couponId);
    }

    return this.prisma.luckyDrawPrize.create({
      data: {
        activityId,
        prizeType,
        prizeName: dto.prizeName,
        couponId:
          prizeType === LUCKY_DRAW_PRIZE_TYPE.COUPON
            ? (couponId ?? null)
            : null,
        prizeValue:
          prizeType === LUCKY_DRAW_PRIZE_TYPE.COIN ||
          prizeType === LUCKY_DRAW_PRIZE_TYPE.BALANCE
            ? new Prisma.Decimal(prizeValue as number)
            : null,
        stock: dto.stock ?? -1,
        sortOrder: dto.sortOrder ?? 0,
        probability: new Prisma.Decimal(probability),
      },
    });
  }

  async listPrizes(activityId: string) {
    await this.requireActivity(activityId);
    const list = await this.prisma.luckyDrawPrize.findMany({
      where: { activityId },
      orderBy: { probability: 'desc' },
      include: { coupon: { select: { couponName: true } } },
    });

    return list.map((item) => ({
      ...item,
      couponName: item.coupon?.couponName,
    }));
  }

  async updatePrize(id: string, dto: UpdatePrizeDto) {
    const prize = await this.requirePrize(id);
    const { probability } = dto;

    if (probability !== undefined) {
      await this.validateProbabilitySum(prize.activityId, id, probability);
    }

    const finalType = dto.prizeType ?? prize.prizeType;
    const finalCouponId =
      dto.couponId === undefined ? prize.couponId : dto.couponId;
    const finalPrizeValue =
      dto.prizeValue === undefined
        ? (prize.prizeValue?.toNumber() ?? null)
        : dto.prizeValue;

    this.validatePrizePayload(finalType, finalCouponId, finalPrizeValue);
    if (finalType === LUCKY_DRAW_PRIZE_TYPE.COUPON && finalCouponId) {
      await this.validateCoupon(finalCouponId);
    }

    const data: Prisma.LuckyDrawPrizeUncheckedUpdateInput = {};
    if (dto.prizeType !== undefined) data.prizeType = dto.prizeType;
    if (dto.prizeName !== undefined) data.prizeName = dto.prizeName;
    if (dto.stock !== undefined) data.stock = dto.stock;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (probability !== undefined) {
      data.probability = new Prisma.Decimal(probability);
    }
    data.couponId =
      finalType === LUCKY_DRAW_PRIZE_TYPE.COUPON
        ? (finalCouponId ?? null)
        : null;
    data.prizeValue =
      finalType === LUCKY_DRAW_PRIZE_TYPE.COIN ||
      finalType === LUCKY_DRAW_PRIZE_TYPE.BALANCE
        ? new Prisma.Decimal(finalPrizeValue as number)
        : null;

    return this.prisma.luckyDrawPrize.update({
      where: { id },
      data,
    });
  }

  async deletePrize(id: string) {
    await this.requirePrize(id);
    return this.prisma.luckyDrawPrize.delete({ where: { id } });
  }

  // ================================================================
  // Results Listing
  // ================================================================

  async listResults(activityId: string, paginate: PaginateDto) {
    await this.requireActivity(activityId);

    const { page = 1, pageSize = 20 } = paginate;
    const where: Prisma.LuckyDrawResultWhereInput = {
      ticket: { activityId },
    };

    const [total, list] = await this.prisma.$transaction([
      this.prisma.luckyDrawResult.count({ where }),
      this.prisma.luckyDrawResult.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          ticket: {
            select: {
              activityId: true,
              orderId: true,
            },
          },
          user: { select: { nickname: true, avatar: true } },
          prize: {
            include: {
              coupon: { select: { couponName: true } },
              activity: {
                select: {
                  title: true,
                  treasure: { select: { treasureName: true } },
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      total,
      list: list.map((r) => ({
        ...r,
        activityId: r.ticket.activityId,
        orderId: r.ticket.orderId,
        userNickname: r.user.nickname,
        userAvatar: r.user.avatar,
        prizeName: r.prize.prizeName,
        prizeType: r.prize.prizeType,
        couponName: r.prize.coupon?.couponName ?? null,
        activityTitle: r.prize.activity.title,
        treasureName: r.prize.activity.treasure?.treasureName ?? null,
      })),
      page,
      pageSize,
    };
  }

  // ================================================================
  // Private Helpers
  // ================================================================

  private async requireActivity(id: string) {
    const activity = await this.prisma.luckyDrawActivity.findUnique({
      where: { id },
    });
    if (!activity) {
      throw new NotFoundException(`Activity with ID "${id}" not found.`);
    }
    return activity;
  }

  private async requirePrize(id: string) {
    const prize = await this.prisma.luckyDrawPrize.findUnique({
      where: { id },
    });
    if (!prize) {
      throw new NotFoundException(`Prize with ID "${id}" not found.`);
    }
    return prize;
  }

  private async validateTreasure(treasureId: string) {
    const treasure = await this.prisma.treasure.findUnique({
      where: { treasureId },
    });
    if (!treasure) {
      throw new BadRequestException(
        `Treasure with ID "${treasureId}" not found.`,
      );
    }
  }

  private async validateCoupon(couponId: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id: couponId },
    });
    if (!coupon) {
      throw new BadRequestException(`Coupon with ID "${couponId}" not found.`);
    }
  }

  private validateTimeRange(startAt?: string, endAt?: string) {
    if (!startAt || !endAt) {
      return;
    }
    if (new Date(startAt) >= new Date(endAt)) {
      throw new BadRequestException('startAt must be earlier than endAt.');
    }
  }

  private async validateProbabilitySum(
    activityId: string,
    excludePrizeId: string | null,
    newProbability: number,
  ) {
    const agg = await this.prisma.luckyDrawPrize.aggregate({
      _sum: { probability: true },
      where: {
        activityId,
        ...(excludePrizeId && { id: { not: excludePrizeId } }),
      },
    });
    const existing = agg._sum.probability?.toNumber() ?? 0;
    if (existing + newProbability > 100) {
      throw new BadRequestException(
        `Probability sum would exceed 100 (current: ${existing}, adding: ${newProbability}).`,
      );
    }
  }

  private validatePrizePayload(
    prizeType: number,
    couponId?: string | null,
    prizeValue?: number | null,
  ) {
    if (prizeType < 1 || prizeType > 4) {
      throw new BadRequestException('prizeType must be between 1 and 4.');
    }
    if (prizeType === LUCKY_DRAW_PRIZE_TYPE.COUPON && !couponId) {
      throw new BadRequestException('Coupon ID is required for coupon prizes.');
    }
    if (
      (prizeType === LUCKY_DRAW_PRIZE_TYPE.COIN ||
        prizeType === LUCKY_DRAW_PRIZE_TYPE.BALANCE) &&
      (!prizeValue || prizeValue <= 0)
    ) {
      throw new BadRequestException(
        'A positive prizeValue is required for coin/balance prizes.',
      );
    }
  }

  private asOptionalString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  private asOptionalNullableString(value: unknown): string | null | undefined {
    if (value === null) return null;
    if (typeof value === 'string') return value;
    return undefined;
  }

  private asOptionalNumber(value: unknown): number | undefined {
    return typeof value === 'number' ? value : undefined;
  }
}
