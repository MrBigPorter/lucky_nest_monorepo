import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { WalletService } from '@api/client/wallet/wallet.service';
import { ApplyWithdrawDto } from '@api/client/wallet/dto/apply-withdraw.dto';
import { Prisma } from '@prisma/client';
import {
  BizPrefix,
  OrderNoHelper,
  RECHARGE_STATUS,
  RelatedType,
  WITHDRAW_STATUS,
} from '@lucky/shared';
import { CreateRechargeDto } from '@api/client/wallet/dto/create-recharge.dto';
import { TransactionQueryDto } from '@api/client/wallet/dto/transaction-query.dto';
import { WithdrawalHistoryQueryDto } from '@api/client/wallet/dto/withdrawal-history-query.dto';
import { PaymentService } from '@api/common/payment/payment.service';
import { TRANSACTION_STATUS } from '@lucky/shared/dist/types/wallet';

@Injectable()
export class ClientWalletService {
  private logger = new Logger(ClientWalletService.name);
  constructor(
    private paymentService: PaymentService,
    private prismaService: PrismaService,
    private walletService: WalletService,
  ) {}

  async handleUniversalWebhook(payload: any) {
    //  判定逻辑 1: 是否为代付/提现 (Payout)
    // 依据：Xendit Payout V2 API 回调一定包含 event 字段，且以 'payout.' 开头
    if (
      payload?.event &&
      typeof payload?.event === 'string' &&
      payload?.event?.startsWith('payout.')
    ) {
      this.logger.log(
        `[Webhook Router] Identified as PAYOUT (Event: ${payload.event})`,
      );
      return this.handlePayoutWebhook(payload.data);
    }

    // 判定逻辑 2: 依据 external_id
    if (payload?.external_id) {
      this.logger.log(
        `[Webhook Router] Identified as INVOICE (Order: ${payload.external_id})`,
      );
      return this.handleInvoiceWebhook(payload);
    }

    // 兜底逻辑：无法识别
    this.logger.warn(`[Webhook Router] Unknown payload format, ignored.`);
    return { status: 'IGNORED', reason: 'Unknown Format' };
  }

  /**
   * Handle recharge webhook from payment gateway
   * @param payload
   */
  private async handleInvoiceWebhook(payload: any) {
    const orderNo = payload.external_id;
    const status = payload.status; // 'PAID', 'EXPIRED', etc.
    const amount = payload.amount;
    const transactionId = payload.id;

    // double check prefix
    if (!orderNo || !orderNo.startsWith(BizPrefix.DEPOSIT)) {
      this.logger.warn(`[Invoice] Invalid OrderNo prefix: ${orderNo}`);
      return { status: 'IGNORED', message: 'Invalid Prefix' };
    }

    this.logger.log(`[Invoice Logic] Processing ${orderNo}, Status: ${status}`);

    // Ignore non-successful statuses
    if (status !== 'PAID' && status !== 'SETTLED' && status !== 'SUCCESS') {
      return { status: 'IGNORED', message: `Status is ${status}` };
    }

    const amountDecimal = new Prisma.Decimal(amount);

    return this.prismaService.$transaction(async (ctx) => {
      // check if order exists
      const order = await this.prismaService.rechargeOrder.findUnique({
        where: { rechargeNo: orderNo },
      });

      if (!order) {
        throw new InternalServerErrorException(
          `Recharge order not found: ${orderNo}`,
        );
      }

      // Idempotency check, return if already processed
      if (order.rechargeStatus === RECHARGE_STATUS.SUCCESS) {
        return {
          message: 'Order already processed',
          order,
        };
      }

      // Verify amount, throw error if mismatch
      if (!order.rechargeAmount.equals(amountDecimal)) {
        this.logger.error(
          `Amount mismatch for ${orderNo}. Order: ${order.rechargeAmount}, Paid: ${amountDecimal}`,
        );
        throw new InternalServerErrorException('Amount mismatch in callback');
      }

      // Credit user's wallet
      await this.walletService.creditCash(
        {
          userId: order.userId,
          amount: amountDecimal,
          related: {
            id: order.rechargeId,
            type: RelatedType.RECHARGE,
          },
          desc: `Recharge via Xendit. Txn: ${transactionId}`,
        },
        ctx,
      );

      // Update recharge order status
      await ctx.rechargeOrder.update({
        where: { rechargeId: order.rechargeId },
        data: {
          rechargeStatus: RECHARGE_STATUS.SUCCESS,
          thirdPartyOrderNo: transactionId,
          paidAt: new Date(),
          callbackData: payload,
        },
      });

      return { status: 'SUCCESS', message: 'Recharge processed successfully' };
    });
  }

  /**
   * Handle disbursement (withdrawal) webhook from payment gateway
   * @param payload
   */
  private async handlePayoutWebhook(payload: any) {
    const orderNo = payload.reference_id;
    const status = payload.status; // 'COMPLETED', 'FAILED', etc.
    const failureCode = payload.failure_code;

    // double check prefix
    if (!orderNo || !orderNo.startsWith(BizPrefix.WITHDRAW)) {
      this.logger.warn(`[Payout] Invalid OrderNo prefix: ${orderNo}`);
      return { status: 'IGNORED', message: 'Invalid Prefix' };
    }

    this.logger.log(`[Payout Logic] Processing ${orderNo}, Status: ${status}`);

    return this.prismaService.$transaction(async (ctx) => {
      // Find the withdrawal order
      const order = await ctx.withdrawOrder.findUnique({
        where: { withdrawNo: orderNo },
      });
      if (!order) {
        throw new NotFoundException(`Withdrawal order not found: ${orderNo}`);
      }

      // Idempotency check: return if already processed
      if (
        order.withdrawStatus === WITHDRAW_STATUS.SUCCESS ||
        order.withdrawStatus === WITHDRAW_STATUS.FAILED
      ) {
        return {
          message: 'Withdrawal order already processed',
          order,
        };
      }

      const amount = order.actualAmount;

      if (status === 'SUCCEEDED' || status === 'COMPLETED') {
        await ctx.userWallet.update({
          where: { userId: order.userId },
          data: {
            frozenBalance: { decrement: amount }, // Unfreeze the amount
            totalWithdraw: { increment: amount }, // Increment total withdrawn
          },
        });

        // Update withdrawal order status to SUCCESS
        await ctx.walletTransaction.updateMany({
          where: {
            relatedId: order.withdrawId,
            relatedType: RelatedType.WITHDRAWAL,
          },
          data: {
            status: TRANSACTION_STATUS.SUCCESS,
            description: 'Withdrawal completed successfully',
          },
        });

        // Update withdrawal order status
        await ctx.withdrawOrder.update({
          where: { withdrawId: order.withdrawId },
          data: {
            withdrawStatus: WITHDRAW_STATUS.SUCCESS,
            completedAt: new Date(),
          },
        });
      } else if (status === 'FAILED') {
        this.logger.warn(`Disbursement Failed for ${orderNo}: ${failureCode}`);
        // Unfreeze the amount back to available balance
        await this.walletService.unfreezeCash(
          {
            userId: order.userId,
            amount: amount,
            related: {
              id: order.withdrawId,
              type: RelatedType.WITHDRAWAL,
            },
            desc: `Withdrawal failed: ${failureCode}`,
          },
          ctx,
        );
        // Update withdrawal order status to FAILED
        await ctx.withdrawOrder.update({
          where: { withdrawId: order.withdrawId },
          data: {
            withdrawStatus: WITHDRAW_STATUS.FAILED,
            completedAt: new Date(),
            rejectReason: `Disbursement failed: ${failureCode}`,
          },
        });

        return { status: 'PROCESSED', xendit_status: status };
      }
    });
  }

  /** Apply for a withdrawal
   *
   * @param userId
   * @param dto
   */
  async applyWithdraw(userId: string, dto: ApplyWithdrawDto) {
    const { amount: amountNum, account, accountName, withdrawMethod } = dto;

    const amount = new Prisma.Decimal(amountNum);

    return this.prismaService.$transaction(async (ctx) => {
      const order = await ctx.withdrawOrder.create({
        data: {
          withdrawNo: OrderNoHelper.generate(BizPrefix.WITHDRAW),
          userId,
          withdrawAmount: amount,
          actualAmount: amount,
          feeAmount: new Prisma.Decimal(0),
          withdrawStatus: WITHDRAW_STATUS.PENDING_AUDIT,
          accountName,
          withdrawMethod,
          withdrawAccount: account,
        },
      });

      await this.walletService.freezeCash(
        {
          userId,
          amount,
          related: {
            id: order.withdrawId,
            type: RelatedType.WITHDRAWAL,
          },
          desc: ` Apply for withdrawal, freeze amount `,
        },
        ctx,
      );

      return order;
    });
  }

  /** Create a recharge order
   *
   * @param userId
   * @param dto
   */
  async createRecharge(userId: string, dto: CreateRechargeDto) {
    const amount = new Prisma.Decimal(dto.amount);

    // Generate a unique recharge order number
    const rechargeNo = OrderNoHelper.generate(BizPrefix.DEPOSIT);

    // Create the recharge pending order in the database
    const order = await this.prismaService.rechargeOrder.create({
      data: {
        rechargeNo,
        userId,
        rechargeAmount: amount,
        actualAmount: amount,
        rechargeStatus: RECHARGE_STATUS.PENDING,
        paymentMethod: 1, // EWallet online
      },
    });

    // Create payment link via payment gateway ,get xendit invoice url
    try {
      let paymentUrl = await this.paymentService.createRechargeLink(
        order.rechargeNo,
        amount.toNumber(),
        // user.email,
      );
      // return { payUrl: order.payUrl, orderId: order.rechargeId };
      return {
        rechargeNo: order.rechargeNo,
        rechargeAmount: order.rechargeAmount.toString(),
        payUrl: paymentUrl,
        rechargeStatus: order.rechargeStatus,
      };
    } catch (e) {
      // In case of failure, we might want to handle it (e.g., log, cleanup)
      throw e;
    }
  }

  /** Get transaction history
   *
   * @param userId
   * @param dto
   */
  async getTransactionHistory(userId: string, dto: TransactionQueryDto) {
    const { page = 1, pageSize = 10, balanceType, transactionType } = dto;
    const skip = (page - 1) * pageSize;

    const whereConditions: Prisma.WalletTransactionScalarWhereInput = {};

    if (balanceType) {
      whereConditions.balanceType = balanceType;
    }

    if (transactionType) {
      whereConditions.transactionType = transactionType;
    }

    const [total, list] = await this.prismaService.$transaction([
      this.prismaService.walletTransaction.findMany({
        where: { userId, ...whereConditions },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.walletTransaction.count({
        where: { userId, ...whereConditions },
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      list,
    };
  }

  /** Get withdrawal history
   *
   * @param userId
   * @param dto
   */
  async getWithdrawalHistory(userId: string, dto: WithdrawalHistoryQueryDto) {
    const { page = 1, pageSize = 10, status } = dto;
    const skip = (page - 1) * pageSize;

    const whereConditions: Prisma.WithdrawOrderWhereInput = {};

    if (status) {
      whereConditions.withdrawStatus = status;
    }

    const [total, list] = await this.prismaService.$transaction([
      this.prismaService.withdrawOrder.findMany({
        where: { userId, ...whereConditions },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          withdrawNo: true,
          withdrawAmount: true,
          actualAmount: true,
          withdrawStatus: true,
          accountName: true,
          withdrawMethod: true,
          withdrawAccount: true,
          createdAt: true,
          completedAt: true,
          auditedAt: true,
          rejectReason: true,
        },
      }),
      this.prismaService.withdrawOrder.count({
        where: { userId, ...whereConditions },
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      list,
    };
  }
}
