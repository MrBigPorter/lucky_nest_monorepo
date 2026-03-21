import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { WalletService } from '@api/client/wallet/wallet.service';
import { Prisma } from '@prisma/client';
import { CheckoutDto } from '@api/client/orders/dto/checkout.dto';
import {
  BizPrefix,
  COUPON_TYPE,
  GROUP_STATUS,
  ORDER_STATUS,
  OrderNoHelper,
  PAY_STATUS,
  REFUND_STATUS,
  TREASURE_STATE,
} from '@lucky/shared';
import { GroupService } from '@api/common/group/group.service';
import { ERROR_KEYS } from '@api/common/error-codes.gen';
import { throwBiz } from '@api/common/exceptions/biz.exception';
import { RefundApplyDto } from '@api/client/orders/dto/refund-apply.dto';
import { LuckyDrawService } from '@api/common/lucky-draw/lucky-draw.service';

const D = (n: number | string) => new Prisma.Decimal(n);

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
    private group: GroupService,
    private luckyDraw: LuckyDrawService,
  ) {}

  private async getExchangeRateTx(
    tx: Prisma.TransactionClient,
  ): Promise<Prisma.Decimal> {
    const cfg = await tx.systemConfig
      .findFirst({
        where: { key: 'exchange_rate' },
        select: { value: true },
      })
      .catch(() => null as any);
    return D(cfg?.value ? Number(cfg.value) : 10);
  }

  async checkOut(userId: string, dto: CheckoutDto) {
    //  FIX 1: Destructure couponId from DTO
    const {
      treasureId,
      addressId,
      entries,
      groupId,
      paymentMethod,
      isGroup,
      couponId,
    } = dto;

    if (!entries || entries < 1) {
      throw new BadRequestException('entries must be at least 1');
    }
    if (![1, 2].includes(Number(paymentMethod)))
      throw new BadRequestException('invalid payment method');

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const rate = await this.getExchangeRateTx(tx);

        // Get treasure details, validate availability
        const treasure = await tx.treasure.findUnique({
          where: { treasureId: treasureId },
          select: {
            treasureId: true,
            state: true,
            unitAmount: true,
            soloAmount: true,
            seqShelvesQuantity: true,
            seqBuyQuantity: true,
            maxPerBuyQuantity: true,
            maxUnitCoins: true,
          },
        });

        // Validate treasure
        if (!treasure || treasure.state !== TREASURE_STATE.ACTIVE) {
          throw new BadRequestException('treasure not available for purchase');
        }
        if (
          treasure.maxPerBuyQuantity &&
          entries > treasure.maxPerBuyQuantity
        ) {
          throw new BadRequestException(
            `cannot purchase more than ${treasure.maxPerBuyQuantity} entries at once`,
          );
        }

        // available stock check will be done at stock deduction step
        const available =
          Number(treasure.seqShelvesQuantity) - Number(treasure.seqBuyQuantity);

        if (available <= 0) {
          throw new BadRequestException('insufficient treasure stock');
        }

        if (entries > available) {
          throw new BadRequestException(
            `only ${available} entries left in stock`,
          );
        }

        // maxPerBuyQuantity check
        const cap = treasure.maxPerBuyQuantity
          ? Number(treasure.maxPerBuyQuantity)
          : null;

        if (cap && cap > 0) {
          const agg = await tx.order.aggregate({
            _sum: { buyQuantity: true },
            where: {
              userId,
              treasureId,
              payStatus: PAY_STATUS.PAID,
              orderStatus: ORDER_STATUS.PAID,
              NOT: {
                refundStatus: REFUND_STATUS.REFUNDED,
              },
            },
          });

          const alreadyBought = Number(agg._sum.buyQuantity || 0);
          const leftQuota = cap - alreadyBought;
          if (leftQuota <= 0) {
            throw new BadRequestException(
              `purchase limit of ${cap} entries reached for this treasure`,
            );
          }
          if (entries > leftQuota) {
            throw new BadRequestException(
              `can only purchase ${leftQuota} more entries for this treasure`,
            );
          }
        }

        // Default to group price
        let finalUnitPrice = treasure.unitAmount as unknown as Prisma.Decimal;
        const isSoloBuy = isGroup === false;

        if (isSoloBuy) {
          const soloPrice = treasure.soloAmount as unknown as Prisma.Decimal;
          if (!soloPrice || soloPrice.lte(0)) {
            throw new BadRequestException(
              'solo purchase not available for this treasure',
            );
          }
          finalUnitPrice = soloPrice;
        }

        // ==========================================
        // 秒杀价格注入（Flash Sale Price Injection）
        // ==========================================
        const { flashSaleProductId } = dto;
        if (flashSaleProductId) {
          const fsp = await tx.flashSaleProduct.findUnique({
            where: { id: flashSaleProductId },
            include: { session: true },
          });
          const now = new Date();

          if (!fsp)
            throw new BadRequestException('Flash sale product not found');
          if (fsp.treasureId !== treasureId)
            throw new BadRequestException('Flash sale product mismatch');
          if (fsp.session.status !== 1)
            throw new BadRequestException('Flash sale session is not active');
          if (now < fsp.session.startTime || now > fsp.session.endTime)
            throw new BadRequestException('Flash sale is not in progress');

          // 原子扣减秒杀库存（防超卖）
          const deducted = await tx.$executeRaw`
            UPDATE flash_sale_products
               SET flash_stock = flash_stock - ${entries}
             WHERE id = ${flashSaleProductId}
               AND flash_stock >= ${entries}
          `;
          if (deducted !== 1)
            throw new BadRequestException('Flash sale stock insufficient');

          // 用秒杀价替换
          finalUnitPrice = fsp.flashPrice as unknown as Prisma.Decimal;
        }

        // Calculate original total amount
        const originalAmount = finalUnitPrice.mul(entries);

        let couponAmount = D(0);
        let coinUsed = D(0);
        let coinAmount = D(0);

        // ==========================================
        //  FIX 2: Coupon Deduction Logic (Uncommented & Schema-Aligned)
        // ==========================================
        // ==========================================
        // 1. 优惠券抵扣逻辑 (修复满减漏洞 & TS 类型限制)
        // ==========================================
        if (couponId) {
          const userCoupon = await tx.userCoupon.findFirst({
            where: { id: couponId, userId: userId, status: 0 },
            include: { coupon: true },
          });

          if (!userCoupon) {
            throw new BadRequestException('Invalid or already used coupon.');
          }
          if (userCoupon.validEndAt && new Date() > userCoupon.validEndAt) {
            throw new BadRequestException('Coupon has expired.');
          }
          if (originalAmount.lessThan(userCoupon.coupon.minPurchase)) {
            throw new BadRequestException(
              'Order amount does not meet coupon minimum purchase requirement.',
            );
          }

          if (userCoupon.coupon.discountType === COUPON_TYPE.FULL_REDUCTION) {
            // 1 = Fixed amount deduction
            couponAmount = userCoupon.coupon.discountValue;
          } else if (userCoupon.coupon.discountType === COUPON_TYPE.DISCOUNT) {
            // 2 = Percentage discount
            const discount = originalAmount.mul(
              userCoupon.coupon.discountValue.div(100),
            );
            const maxDiscount = userCoupon.coupon.maxDiscount
              ? userCoupon.coupon.maxDiscount
              : null;
            couponAmount =
              maxDiscount && discount.greaterThan(maxDiscount)
                ? maxDiscount
                : discount;
          }

          // 核心防御：优惠券抵扣金额【绝不能超过】商品原本的总价！
          // 例如商品 50 块，满减券 100 块，实际只能抵扣 50 块。
          if (couponAmount.greaterThan(originalAmount)) {
            couponAmount = originalAmount;
          }

          // 立即更新优惠券为已使用状态，并记录【真实抵扣金额】
          await tx.userCoupon.update({
            where: { id: couponId },
            data: {
              status: 1,
              usedAt: new Date(),
              discountAmount: couponAmount,
            },
          });
        }

        // Calculate remaining amount after applying the coupon
        let remainingAmount = originalAmount.sub(couponAmount);
        if (remainingAmount.lt(0)) remainingAmount = D(0);

        // ==========================================
        //  FIX 3: Coin Deduction Logic (Only applies to remaining balance)
        // ==========================================
        if (paymentMethod === 2 && remainingAmount.gt(0)) {
          const w = await this.wallet.ensureWallet(userId, tx);
          const maxCoinUsable = treasure.maxUnitCoins?.mul(entries) || D(0);

          // Coins needed to pay off the remaining balance after coupon
          const coinsNeededForRemaining = remainingAmount.mul(rate);

          // Actual max coins allowed (min of product limit vs needed for remaining balance)
          const actualMaxCoins = Prisma.Decimal.min(
            maxCoinUsable,
            coinsNeededForRemaining,
          );

          const canUseCoins = w.coinBalance.lessThan(actualMaxCoins)
            ? w.coinBalance
            : actualMaxCoins;

          coinUsed = canUseCoins;
          coinAmount = canUseCoins.div(rate);
        }

        //  FIX 4: Final amounts calculation
        const finalAmount = remainingAmount.sub(coinAmount);
        // Total discount is the sum of both coupon and coins
        const discountAmount = couponAmount.add(coinAmount);

        const createdTxnIds: string[] = [];

        // deduce wallet coin balance before cash payment
        const related = { id: null as any, type: 'order' as string };
        if (paymentMethod == 2 && coinUsed.gt(0)) {
          const { transactionId: coinTxnId } = await this.wallet.debitCoin(
            {
              userId,
              coins: coinUsed,
              related,
              desc: `coin discount for treasure ${treasureId}`,
            },
            tx,
          );
          createdTxnIds.push(coinTxnId);
        }

        if (finalAmount.gt(0)) {
          const { transactionId } = await this.wallet.debitCash(
            {
              userId,
              amount: finalAmount,
              related,
              desc: `order pay for treasure ${treasureId}`,
            },
            tx,
          );
          createdTxnIds.push(transactionId);
        }

        // safe to deduce stock now, ensure enough stock
        const uqd = await tx.$executeRaw`
                          UPDATE treasures
                             SET seq_buy_quantity = seq_buy_quantity + ${entries}
                           WHERE treasure_id = ${treasureId}
                             AND state = ${TREASURE_STATE.ACTIVE}
                             AND (seq_shelves_quantity - seq_buy_quantity) >= ${entries}
                        `;

        if (uqd !== 1) {
          throw new BadRequestException('insufficient treasure stock');
        }

        // create order record
        const order = await tx.order.create({
          data: {
            orderNo: OrderNoHelper.generate(BizPrefix.ORDER),
            userId,
            treasureId,
            originalAmount,
            discountAmount,
            couponAmount,
            coinAmount,
            finalAmount,
            buyQuantity: entries,
            unitPrice: finalUnitPrice,
            orderStatus: ORDER_STATUS.PAID,
            payStatus: PAY_STATUS.PAID,
            refundStatus: REFUND_STATUS.NO_REFUND,
            paidAt: new Date(),
            coinUsed,
            groupId: null,
            isGroupOwner: 0,
            userCouponId: couponId || null,
            flashSaleProductId: flashSaleProductId || null,
          },
          select: {
            orderId: true,
            orderNo: true,
            treasureId: true,
          },
        });

        // fill the transaction related id
        await tx.walletTransaction.updateMany({
          where: {
            id: { in: createdTxnIds },
          },
          data: {
            relatedId: order.orderId,
          },
        });

        // Branch logic: skip grouping if it's a solo buy
        let finalGroupId = null;
        let isOwner = 0;
        let alreadyInGroup = false;

        if (!isSoloBuy) {
          const res = await this.group.joinOrCreateGroup(
            { userId, treasureId, orderId: order.orderId, groupId: groupId },
            tx,
          );
          finalGroupId = res.finalGroupId;
          isOwner = res.isOwner;
          alreadyInGroup = res.alreadyInGroup;
        }

        // update order with groupId and isOwner
        await tx.order.update({
          where: { orderId: order.orderId },
          data: {
            groupId: finalGroupId,
            isGroupOwner: isOwner,
          },
        });

        // return order summary
        return {
          orderId: order.orderId,
          orderNo: order.orderNo,
          treasureId: order.treasureId,
          lotteryTickets: [],
          activityCoin: 0,
          groupId: finalGroupId ?? '',
          isGroupOwner: isOwner,
          alreadyInGroup,
        };
      });
      // Step 6: fire-and-forget 发放福利抽奖券（仅单独购买时）
      if (dto.isGroup === false) {
        setImmediate(() => {
          this.luckyDraw
            .issueTicketForOrder(userId, dto.treasureId, result.orderId)
            .catch((e: unknown) => {
              this.logger.warn(
                `LuckyDraw solo ticket failed for order ${result.orderId}: ${
                  e instanceof Error ? e.message : String(e)
                }`,
              );
            });
        });
      }
      return result;
    } catch (e) {
      console.log('checkout error:', e);
      throw e;
    }
  }

  /**
   * 申请退款 - apply for a refund
   * @param userId
   * @param dto
   */
  async applyRefund(userId: string, dto: RefundApplyDto) {
    const { orderId, reason } = dto;

    if (!userId) return throwBiz(ERROR_KEYS.UNAUTHORIZED);
    if (!orderId) return throwBiz(ERROR_KEYS.ORDER_NUMBER_ERROR);
    const order = await this.prisma.order.findUnique({
      where: { orderId },
    });
    if (!order) {
      return throwBiz(
        ERROR_KEYS.ORDER_NUMBER_OR_THIRD_PARTY_ORDER_NUMBER_ERROR,
      );
    }

    // only paid orders can be refunded
    if (order.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to refund this order',
      );
    }

    // only paid orders can be refunded
    if (
      order.payStatus !== PAY_STATUS.PAID ||
      order.orderStatus !== ORDER_STATUS.PAID
    ) {
      throw new BadRequestException('Only paid orders can be refunded');
    }

    // already refunded
    if (order.refundStatus !== REFUND_STATUS.NO_REFUND) {
      throw new BadRequestException(
        'Refund is already in progress or completed.',
      );
    }

    // update order to refunding status
    return this.prisma.order.update({
      where: { orderId },
      data: {
        refundStatus: REFUND_STATUS.REFUNDING,
        refundReason: reason,
        refundAppliedBy: userId, // 申请退款用户
        refundedAt: null,
      },
    });
  }
  // order list
  async listOrders(
    userId: string,
    q: {
      status?: 'all' | 'paid' | 'unpaid' | 'refunded' | 'cancelled';
      page?: number;
      pageSize?: number;
      treasureId?: string;
    },
  ) {
    if (!userId) return throwBiz(ERROR_KEYS.UNAUTHORIZED);

    const status = q.status || 'all';
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(q.pageSize ?? 20)));
    const treasureId = q.treasureId || null;

    const where = this.whereByStatus(userId, status, treasureId || undefined);

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { orderId: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          orderId: true,
          orderNo: true,
          createdAt: true,
          updatedAt: true,
          buyQuantity: true,
          treasureId: true,
          unitPrice: true,
          originalAmount: true,
          discountAmount: true,
          couponAmount: true,
          coinAmount: true,
          finalAmount: true,
          orderStatus: true,
          payStatus: true,
          refundStatus: true,
          paidAt: true,
          treasure: {
            select: {
              treasureName: true,
              treasureCoverImg: true,
              productName: true,
              virtual: true,
              cashAmount: true,
              cashState: true,
              seqBuyQuantity: true,
              seqShelvesQuantity: true,
            },
          },
          group: {
            where: { groupStatus: GROUP_STATUS.ACTIVE },
            select: {
              groupId: true,
              currentMembers: true,
              maxMembers: true,
              groupStatus: true,
            },
          },
        },
      }),
    ]);

    return {
      page,
      pageSize,
      total,
      list: rows,
    };
  }

  // order details
  async getOrderDetail(userId: string, orderId: string) {
    if (!userId) return throwBiz(ERROR_KEYS.UNAUTHORIZED);
    if (!orderId) return throwBiz(ERROR_KEYS.ORDER_NUMBER_ERROR);

    // check order
    const row = await this.prisma.order.findFirst({
      where: { orderId, userId },
      select: {
        orderId: true,
        orderNo: true,
        createdAt: true,
        updatedAt: true,
        buyQuantity: true,
        treasureId: true,
        unitPrice: true,
        originalAmount: true,
        discountAmount: true,
        couponAmount: true,
        coinAmount: true,
        finalAmount: true,
        orderStatus: true,
        payStatus: true,
        refundStatus: true,
        paidAt: true,
        treasure: {
          select: {
            treasureName: true,
            treasureCoverImg: true,
            productName: true,
            virtual: true,
            cashAmount: true,
            cashState: true,
            seqBuyQuantity: true,
            seqShelvesQuantity: true,
          },
        },
        group: {
          where: { groupStatus: GROUP_STATUS.ACTIVE },
          select: {
            groupId: true,
            currentMembers: true,
            maxMembers: true,
            groupStatus: true,
          },
        },
      },
    });

    if (!row)
      return throwBiz(
        ERROR_KEYS.ORDER_NUMBER_OR_THIRD_PARTY_ORDER_NUMBER_ERROR,
      );

    // find related transactions records
    const transactions = await this.prisma.walletTransaction.findMany({
      where: {
        userId,
        relatedId: orderId,
      },
      orderBy: { createdAt: 'desc' },
      take: 2,
      select: {
        transactionNo: true,
        amount: true,
        balanceType: true,
        createdAt: true,
        status: true,
      },
    });

    return {
      ...row,
      transactions,
    };
  }

  // build where condition by status
  private whereByStatus(
    userId: string,
    status: 'all' | 'paid' | 'unpaid' | 'refunded' | 'cancelled',
    treasureId?: string,
  ): Prisma.OrderWhereInput {
    const base: Prisma.OrderWhereInput = {
      userId,
      ...(treasureId ? { treasureId } : {}),
    };

    const OS = ORDER_STATUS;
    const PS = PAY_STATUS;
    const RS = REFUND_STATUS;

    switch (status) {
      case 'paid':
        return {
          ...base,
          payStatus: PS.PAID,
          orderStatus: OS.PAID,
          // 保持现状：只有“未退款”的才算纯粹的“已支付”订单
          // 如果你想让“审核中”的订单依然显示在已支付里，可以把下面这行注释掉，或者改为 { in: [RS.NO_REFUND, RS.REFUND_FAILED] }
          refundStatus: RS.NO_REFUND,
        };
      case 'unpaid':
        return {
          ...base,
          payStatus: PS.UNPAID,
          orderStatus: OS.PENDING_PAYMENT,
        };
      case 'refunded':
        // 只要是 "退款中(1)"、"已退款(2)" 或 "退款失败(3)"，都算作“退款/售后”列表
        return {
          ...base,
          refundStatus: {
            in: [RS.REFUNDING, RS.REFUNDED, RS.REFUND_FAILED],
          },
        };
      case 'cancelled':
        return { ...base, orderStatus: OS.CANCELED };
      case 'all':
      default:
        return base;
    }
  }
}
