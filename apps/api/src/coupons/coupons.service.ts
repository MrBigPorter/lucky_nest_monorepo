import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserCoupon, Coupon } from '@prisma/client';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all coupons held by a user, filtered by status.
   */
  async findUserCoupons(userId: string, status: number) {
    if (isNaN(status)) {
      throw new BadRequestException('Invalid status provided.');
    }
    return this.prisma.userCoupon.findMany({
      where: {
        userId,
        status,
      },
      include: {
        coupon: true, // Include the coupon template details
      },
      orderBy: {
        validTo: 'asc',
      },
    });
  }

  /**
   * Find coupons that are valid for a specific order.
   */
  async findAvailableCouponsForOrder(userId: string, orderAmount: number, treasureIds: string[]) {
    const now = new Date();
    const userCoupons = await this.prisma.userCoupon.findMany({
      where: {
        userId,
        status: 0, // Unused
        validFrom: { lte: now },
        validTo: { gte: now },
      },
      include: { coupon: true },
    });

    const availableCoupons = userCoupons.filter(({ coupon }) => {
      // Check minimum purchase amount
      if (orderAmount < coupon.minPurchaseAmount) {
        return false;
      }
      // Check scope
      if (coupon.useScope === 2) { // Specific categories - V2 feature
        // TODO: Implement category check
        return true; // Placeholder
      }
      if (coupon.useScope === 3) { // Specific products
        const scopeValues = coupon.scopeValues as string[];
        if (!treasureIds.some(id => scopeValues.includes(id))) {
          return false;
        }
      }
      return true;
    });

    return availableCoupons;
  }

  /**
   * Allows a user to claim a coupon.
   */
  async claimCoupon(userId: string, couponId: string): Promise<UserCoupon> {
    return this.prisma.$transaction(async (tx) => {
      const coupon = await tx.coupon.findUnique({
        where: { id: couponId },
      });

      if (!coupon) {
        throw new NotFoundException('Coupon not found.');
      }
      if (coupon.status !== 1) {
        throw new BadRequestException('Coupon is not active.');
      }
      if (coupon.totalQuantity !== -1 && coupon.issuedQuantity >= coupon.totalQuantity) {
        throw new BadRequestException('Coupon is out of stock.');
      }

      const existingClaims = await tx.userCoupon.count({
        where: { userId, couponId },
      });

      if (existingClaims >= coupon.perUserLimit) {
        throw new BadRequestException('You have reached the claim limit for this coupon.');
      }

      await tx.coupon.update({
        where: { id: couponId },
        data: { issuedQuantity: { increment: 1 } },
      });

      const validFrom = new Date();
      let validTo = coupon.validTo;
      if (coupon.validityType === 2 && coupon.validDays) {
        const d = new Date();
        d.setDate(d.getDate() + coupon.validDays);
        validTo = d;
      }

      const userCoupon = await tx.userCoupon.create({
        data: {
          userId,
          couponId,
          validFrom,
          validTo,
          status: 0,
        },
      });

      return userCoupon;
    });
  }

  /**
   * Allows a user to redeem a coupon using a code.
   */
  async redeemCoupon(userId: string, code: string): Promise<UserCoupon> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      throw new NotFoundException('Invalid coupon code.');
    }

    return this.claimCoupon(userId, coupon.id);
  }

  /**
   * Marks a user's coupon as used. To be called by the Order service.
   * @param userCouponId The ID of the UserCoupon instance.
   * @param orderId The ID of the order it's being used for.
   */
  async useCoupon(userCouponId: string, orderId: string, tx: Prisma.TransactionClient) {
    const userCoupon = await tx.userCoupon.findUnique({ where: { id: userCouponId }});
    if (!userCoupon || userCoupon.status !== 0) {
      throw new BadRequestException('Coupon is not available for use.');
    }

    return tx.userCoupon.update({
      where: { id: userCouponId },
      data: {
        status: 1, // Mark as used
        usedAt: new Date(),
        orderId: orderId, // Assuming `orderId` exists on UserCoupon to track usage
      },
    });
  }

  /**
   * Returns a used coupon to the user's wallet. To be called by the Order service.
   * @param userCouponId The ID of the UserCoupon instance.
   */
  async returnCoupon(userCouponId: string, tx: Prisma.TransactionClient) {
    const userCoupon = await tx.userCoupon.findUnique({ where: { id: userCouponId }});
    if (!userCoupon) return; // Fails silently if not found

    const newStatus = new Date() > userCoupon.validTo ? 2 : 0; // 2 if expired, 0 if unused

    return tx.userCoupon.update({
      where: { id: userCouponId },
      data: {
        status: newStatus,
        usedAt: null,
      },
    });
  }
}
