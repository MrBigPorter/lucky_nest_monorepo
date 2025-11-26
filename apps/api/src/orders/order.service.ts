import {BadRequestException, Injectable} from "@nestjs/common";
import {PrismaService} from "@api/prisma/prisma.service";
import {WalletService} from "@api/wallet/wallet.service";
import {Prisma} from "@prisma/client";
import {CheckoutDto} from "@api/orders/dto/checkout.dto";
import {TREASURE_STATE} from "@lucky/shared/dist/types/treasure";
import {ORDER_STATUS, PAY_STATUS, REFUND_STATUS} from "@lucky/shared/dist/types/order";
import {GroupService} from "@api/group/group.service";
import {ERROR_KEYS} from "@api/common/error-codes.gen";
import {throwBiz} from "@api/common/exceptions/biz.exception";

const D = (n: number | string) => new Prisma.Decimal(n);

@Injectable()
export class OrderService {
    constructor(
        private prisma: PrismaService,
        private wallet: WalletService,
        private group: GroupService
    ) {
    }

    // Get exchange rate for the order
    private async getExchangeRateTx(tx: Prisma.TransactionClient): Promise<Prisma.Decimal> {
        const cfg = await tx.systemConfig.findFirst({
            where: {key: 'exchange_rate'}, select: {value: true},
        }).catch(() => null as any);
        return D(cfg?.value ? Number(cfg.value) : 10);
    }

    // Generate a unique order number
    private genOrderNo() {
        const d = new Date();
        const p = (n: number, w = 2) => `${n}`.padStart(w, '0');
        const ts = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}${p(d.getMilliseconds(), 3)}`;
        return `ORD${ts}${Math.floor(Math.random() * 1000)}`;
    }


    /**
     * 下单全流程（同一事务内）：- create order
     * 1. 校验商品 / 限购 / 库存 - check treasure availability / purchase limit / stock
     * 2. 计算金额（原价、金币抵扣、优惠券抵扣）- calculate amounts (original, coin discount, coupon discount)
     * 3. 扣金币 → 扣现金 - deduct coins → deduct cash
     * 4. 并发安全占库存- safe stock deduction
     * 5. 创建订单 - create order record
     * 6. 回填钱包流水 relatedId - fill wallet txn relatedId
     * 7. 组团（加入/开团）+ 回写 groupId - group purchase (join/create) + update groupId
     */

    async checkOut(userId: string, dto: CheckoutDto) {
        const {treasureId, addressId, couponId, entries, groupId, paymentMethod} = dto;
        // Validate entries
        if (!entries || entries < 1) {
            throw new BadRequestException('entries must be at least 1');
        }
        // check payment method
        if (![1, 2].includes(Number(paymentMethod))) throw new BadRequestException('invalid payment method');


        try {
            // Transactional operation
            return this.prisma.$transaction(async (tx) => {

                // Get exchange rate
                const rate = await this.getExchangeRateTx(tx);

                // Get treasure details, validate availability
                const treasure = await tx.treasure.findUnique({
                    where: {treasureId: treasureId},
                    select: {
                        treasureId: true,
                        state: true,
                        unitAmount: true,
                        seqShelvesQuantity: true,
                        seqBuyQuantity: true,
                        maxPerBuyQuantity: true,
                        maxUnitCoins: true,
                    }
                })

                // Validate treasure
                if (!treasure || treasure.state !== TREASURE_STATE.ACTIVE) {
                    throw new BadRequestException('treasure not available for purchase');
                }
                if (treasure.maxPerBuyQuantity && entries > treasure.maxPerBuyQuantity) {
                    throw new BadRequestException(`cannot purchase more than ${treasure.maxPerBuyQuantity} entries at once`);
                }

                // available stock check will be done at stock deduction step
                const available = Number(treasure.seqShelvesQuantity) - Number(treasure.seqBuyQuantity);

                if (available <= 0) {
                    throw new BadRequestException('insufficient treasure stock');
                }

                if (entries > available) {
                    throw new BadRequestException(`only ${available} entries left in stock`);
                }

                // maxPerBuyQuantity check
                const cap = treasure.maxPerBuyQuantity ? Number(treasure.maxPerBuyQuantity) : null;

                if (cap && cap > 0) {
                    const agg = await tx.order.aggregate({
                        _sum: {buyQuantity: true},
                        where: {
                            userId,
                            treasureId,
                            payStatus: PAY_STATUS.PAID,
                            orderStatus: ORDER_STATUS.PAID,
                            NOT: {
                                // exclude refunded orders
                                refundStatus: REFUND_STATUS.REFUNDED
                            }
                        },
                    })

                    const alreadyBought = Number(agg._sum.buyQuantity || 0);
                    const leftQuota = cap - alreadyBought;
                    if (leftQuota <= 0) {
                        // reached purchase limit
                        throw new BadRequestException(`purchase limit of ${cap} entries reached for this treasure`);
                    }
                    if (entries > leftQuota) {
                        throw new BadRequestException(`can only purchase ${leftQuota} more entries for this treasure`);
                    }
                }

                // Calculate total amount
                const unit = treasure.unitAmount as unknown as Prisma.Decimal;
                const originalAmount = unit.mul(entries);

                let couponAmount = D(0);
                let coinUsed = D(0);
                let coinAmount = D(0);

                // coin payment
                if (paymentMethod === 2) {
                    const w = await this.wallet.ensureWallet(userId, tx);
                    const maxCoinUsable = treasure.maxUnitCoins?.mul(entries) || D(0);
                    const canUseCoins = w.coinBalance.lessThan(maxCoinUsable) ? w.coinBalance : maxCoinUsable;
                    coinUsed = canUseCoins;
                    coinAmount = canUseCoins.div(rate);
                } else {
                    // coupon payment
                    /*if (couponId) {
                        const c = await tx.userCoupon.findUnique({
                            where: { id: couponId },
                            select: { rewardAmount: true, status: true, actEndAt: true },
                        }).catch(() => null as any);
                        const valid = c && c.status === 1 && (!c.actEndAt || c.actEndAt.getTime() > Date.now());
                        couponAmount = valid ? D(c.rewardAmount) : D(0);
                    }*/

                }

                const discountAmount = couponAmount.gt(coinAmount) ? couponAmount : coinAmount;
                const diff = originalAmount.sub(discountAmount);
                const finalAmount = Prisma.Decimal.max(diff, D(0));
                const createdTxnIds: string[] = [];

                // deduce wallet coin balance before cash payment
                const related = {id: null as any, type: 'order' as string};
                if (paymentMethod == 2 && coinUsed.gt(0)) {
                    const {transactionId: coinTxnId} = await this.wallet.debitCoin({
                        userId,
                        coins: coinUsed,
                        related,
                        desc: `coin discount for treasure ${treasureId}`,
                    }, tx);
                    createdTxnIds.push(coinTxnId)
                }
                if (finalAmount.gt(0)) {
                    const {transactionId} = await this.wallet.debitCash({
                        userId,
                        amount: finalAmount,
                        related,
                        desc: `order pay for treasure ${treasureId}`,
                    }, tx);
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
                        orderNo: this.genOrderNo(),
                        userId,
                        treasureId,
                        originalAmount,
                        discountAmount,
                        couponAmount,
                        coinAmount,
                        finalAmount,
                        buyQuantity: entries,
                        unitPrice: unit,
                        orderStatus: ORDER_STATUS.PAID,
                        payStatus: PAY_STATUS.PAID,
                        refundStatus: REFUND_STATUS.NO_REFUND,
                        paidAt: Date.now().toString(),
                        coinUsed,
                        couponId: couponId || null,
                        groupId: null,
                        isGroupOwner: 0
                    },
                    select: {
                        orderId: true,
                        orderNo: true,
                        treasureId: true,
                    }
                });

                // fill the transaction related id
                await tx.walletTransaction.updateMany({
                    where: {
                        id: {in: createdTxnIds},
                    },
                    data: {
                        relatedId: order.orderId,
                    }
                });

                // open group purchase if groupId is provided
                const {finalGroupId, isOwner, alreadyInGroup} = await this.group.joinOrCreateGroup(
                    {userId, treasureId, orderId: order.orderId, groupId: groupId,}, tx
                )
                // update order with groupId and isOwner
                await tx.order.update({
                    where: {orderId: order.orderId},
                    data: {
                        groupId: finalGroupId,
                        isGroupOwner: isOwner,
                    }
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
                    alreadyInGroup
                }
            })
        } catch (e) {
            console.log('checkout error:', e);
            throw e;
        }

    }

    // order list
    async listOrders(
        userId: string,
        q:{
            status?: 'all' | 'paid' | 'unpaid' | 'refunded' | 'cancelled',
            page?: number,
            pageSize?: number,
            treasureId?: string
        }
    ) {
        if (!userId) return throwBiz(ERROR_KEYS.UNAUTHORIZED);

        const status = q.status || 'all';
        const page = Math.max(1, Number(q.page ?? 1));
        const pageSize = Math.min(100, Math.max(1,Number(q.pageSize ?? 20)));
        const treasureId = q.treasureId || null;

        const where = this.whereByStatus(userId, status, treasureId || undefined);


        const [total, list] = await  this.prisma.$transaction([
            this.prisma.order.count({where}),
            this.prisma.order.findMany({
                where,
                orderBy:[{createdAt:'desc'},{orderId:'desc'}],
                skip: (page - 1) * pageSize,
                take: pageSize,
                select:{
                    orderId: true,
                    orderNo: true,
                    createdAt: true,
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
                    treasure:{
                        select:{
                            treasureName: true,
                            treasureCoverImg: true,
                        }
                    }
                }
            })
        ])


        return {
            page,
            pageSize,
            total,
            list:list.map((o)=>({
                ...o,
                createdAt: o.createdAt.getTime(),
                paidAt: o.paidAt ? Number(o.paidAt) : null,
            }))
        }
    }

    // order details
    async getOrderDetail(userId: string, orderId: string) {
        if (!userId) return throwBiz(ERROR_KEYS.UNAUTHORIZED);
        if (!orderId) return throwBiz(ERROR_KEYS.ORDER_NUMBER_ERROR);

        // check order
        const row = await this.prisma.order.findFirst({
            where: {orderId, userId},
            include: {
                treasure: {
                    select: {
                        treasureName: true,
                        treasureCoverImg: true,
                        seqShelvesQuantity: true,
                        seqBuyQuantity: true,
                    }
                }
            }
        })

        if (!row) return throwBiz(ERROR_KEYS.ORDER_NUMBER_OR_THIRD_PARTY_ORDER_NUMBER_ERROR);

        console.log('order detail row:', row);
        // find related transactions records
        const transactions = await this.prisma.walletTransaction.findMany({
            where: {
                userId,
                relatedId: orderId,
            },
            orderBy: {createdAt: 'desc'},
            take: 2,
            select:{
                transactionNo: true,
                amount: true,
                balanceType: true,
                createdAt: true,
                status: true,
            }
        })

        return {
            ...row,
            createdAt: row.createdAt.getTime(),
            paidAt: row.paidAt ? Number(row.paidAt) : null,
            updatedAt: row.updatedAt.getTime(),

            transactions:transactions.map((t)=>({
                ...t,
                createdAt: t.createdAt.getTime(),
            }))
        }

    }

    // build where condition by status
    private whereByStatus(
         userId: string,
         status: 'all' | 'paid' | 'unpaid' | 'refunded' | 'cancelled',
         treasureId?: string
     ): Prisma.OrderWhereInput{
        const base: Prisma.OrderWhereInput = {userId, ...(treasureId?{treasureId}:{})};

        const OS = ORDER_STATUS;
        const PS = PAY_STATUS;
        const RS = REFUND_STATUS;

        switch (status){
            case "paid":
                return {...base, payStatus: PS.PAID, orderStatus: OS.PAID, refundStatus: RS.NO_REFUND};
            case "unpaid":
                return {...base, payStatus: PS.UNPAID, orderStatus: OS.PENDING_PAYMENT};
            case "refunded":
                return {...base, refundStatus: RS.REFUNDED};
            case "cancelled":
                return {...base, orderStatus: OS.CANCELED};
            case "all":
            default:
                return base;
        }
    }



}