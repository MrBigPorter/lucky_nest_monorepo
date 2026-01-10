import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { WalletService } from '@api/client/wallet/wallet.service';
import { Prisma } from '@prisma/client';
import { CheckoutDto } from '@api/client/orders/dto/checkout.dto';
import {
  GROUP_STATUS,
  TREASURE_STATE,
} from '@lucky/shared/dist/types/treasure';
import {
  ORDER_STATUS,
  PAY_STATUS,
  REFUND_STATUS,
} from '@lucky/shared/dist/types/order';
import { GroupService } from '@api/common/group/group.service';
import { ERROR_KEYS } from '@api/common/error-codes.gen';
import { throwBiz } from '@api/common/exceptions/biz.exception';
import { RefundApplyDto } from '@api/client/orders/dto/refund-apply.dto';
import { BizPrefix, OrderNoHelper } from '@lucky/shared';

const D = (n: number | string) => new Prisma.Decimal(n);

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
    private group: GroupService,
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
    const { treasureId, addressId, entries, groupId, paymentMethod, isGroup } =
      dto;
    if (!entries || entries < 1) {
      throw new BadRequestException('entries must be at least 1');
    }
    if (![1, 2].includes(Number(paymentMethod)))
      throw new BadRequestException('invalid payment method');

    try {
      return this.prisma.$transaction(async (tx) => {
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
                // exclude refunded orders
                refundStatus: REFUND_STATUS.REFUNDED,
              },
            },
          });

          const alreadyBought = Number(agg._sum.buyQuantity || 0);
          const leftQuota = cap - alreadyBought;
          if (leftQuota <= 0) {
            // reached purchase limit
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

        // 默认为拼团价
        let finalUnitPrice = treasure.unitAmount as unknown as Prisma.Decimal;
        // 修改后 (正确逻辑：只有明确传入 false 才是单买，默认是拼团)
        const isSoloBuy = isGroup === false;

        if (isSoloBuy) {
          // 单买价
          const soloPrice = treasure.soloAmount as unknown as Prisma.Decimal;
          if (!soloPrice || soloPrice.lte(0)) {
            throw new BadRequestException(
              'solo purchase not available for this treasure',
            );
          }
          // use solo price
          finalUnitPrice = soloPrice;
        }

        // 计算总价 (使用选定后的 finalUnitPrice)
        const originalAmount = finalUnitPrice.mul(entries);

        let couponAmount = D(0);
        let coinUsed = D(0);
        let coinAmount = D(0);

        // coin payment
        if (paymentMethod === 2) {
          const w = await this.wallet.ensureWallet(userId, tx);
          const maxCoinUsable = treasure.maxUnitCoins?.mul(entries) || D(0);
          const canUseCoins = w.coinBalance.lessThan(maxCoinUsable)
            ? w.coinBalance
            : maxCoinUsable;
          coinUsed = canUseCoins;
          coinAmount = canUseCoins.div(rate);
        } /*else if (userCouponId) { // Coupon payment (only if not using coins)
                    const userCoupon = await tx.userCoupon.findFirst({
                        where: { id: userCouponId, userId: userId, status: 0 },
                        include: { coupon: true },
                    });

                    if (!userCoupon) {
                        throw new BadRequestException('Invalid or used coupon.');
                    }
                    if (new Date() > userCoupon.validTo) {
                        throw new BadRequestException('Coupon has expired.');
                    }
                    if (originalAmount.lt(userCoupon.coupon.minPurchaseAmount)) {
                        throw new BadRequestException('Order amount does not meet coupon minimum purchase requirement.');
                    }

                    if (userCoupon.coupon.type === 1 || userCoupon.coupon.type === 3) { // 满减 or 固定
                        couponAmount = D(userCoupon.coupon.value);
                    } else if (userCoupon.coupon.type === 2) { // 折扣
                        const discount = originalAmount.mul(userCoupon.coupon.value.div(100));
                        const maxDiscount = userCoupon.coupon.maxDiscountAmount ? D(userCoupon.coupon.maxDiscountAmount) : null;
                        couponAmount = (maxDiscount && discount.gt(maxDiscount)) ? maxDiscount : discount;
                    }
                }*/

        const discountAmount = couponAmount.gt(coinAmount)
          ? couponAmount
          : coinAmount;
        const diff = originalAmount.sub(discountAmount);
        const finalAmount = Prisma.Decimal.max(diff, D(0));
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

        //4. 分支逻辑：单买跳过拼团
        let finalGroupId = null;
        let isOwner = 0;
        let alreadyInGroup = false;

        // 只有【不是单买】时，才进入拼团逻辑
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
