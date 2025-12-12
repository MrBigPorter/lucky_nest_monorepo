import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { CreateCouponDto } from '@api/admin/coupon/dto/create-coupon.dto';
import { COUPON_STATUS, COUPON_TYPE } from '@lucky/shared';
import { QueryCouponDto } from '@api/admin/coupon/dto/query-coupon.dto';
import { UpdateCouponDto } from '@api/admin/coupon/dto/update-coupon.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CouponService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new coupon
   * @param dto
   */
  async create(dto: CreateCouponDto) {
    // Validate that for FULL_REDUCTION coupons, discountValue is less than minPurchase
    // to prevent illogical coupon configurations, which could lead to negative pricing scenarios.
    if (
      dto.couponType === COUPON_TYPE.FULL_REDUCTION &&
      dto.discountValue >= dto.minPurchase
    ) {
      throw new BadRequestException(
        `For FULL_REDUCTION coupons, discountValue must be less than minPurchase`,
      );
    }
    return this.prisma.coupon.create({
      data: {
        ...dto,
        status: COUPON_STATUS.ACTIVE,
        issuedQuantity: 0,
      },
    });
  }

  /**
   * Get a paginated list of coupons with optional filters
   * @param dto
   * @returns Paginated list of coupons
   *
   */
  async findAll(dto: QueryCouponDto) {
    const { page = 1, pageSize = 10, keyword, status } = dto;
    const skip = (page - 1) * pageSize;

    const whereConditions: Prisma.CouponWhereInput = {};

    if (status) {
      whereConditions.status = status;
    }

    if (keyword) {
      whereConditions.OR = [
        { couponCode: { contains: keyword, mode: 'insensitive' } },
        { couponName: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [total, list] = await this.prisma.$transaction([
      this.prisma.coupon.count({
        where: whereConditions,
      }),
      this.prisma.coupon.findMany({
        where: whereConditions,
        skip: skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, list, page, pageSize };
  }

  /**
   * Get coupon details by ID
   * @param id
   * @returns Coupon details
   */
  async finOne(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });
    if (!coupon) {
      throw new BadRequestException(`Coupon with ID ${id} not found`);
    }

    return coupon;
  }

  /**
   * Update coupon details
   * @param id
   * @param dto
   * @returns Updated coupon
   */
  async update(id: string, dto: UpdateCouponDto) {
    // Ensure the coupon exists
    const coupon = await this.finOne(id);
    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  /**
   * Deactivate a coupon by ID
   * @param id
   * @return Deactivated coupon
   */
  async remove(id: string) {
    // Ensure the coupon exists
    const coupon = await this.finOne(id);
    // Deactivate the coupon instead of deleting it
    return this.prisma.coupon.update({
      where: { id },
      data: {
        status: COUPON_STATUS.INACTIVE,
      },
    });
  }
}
