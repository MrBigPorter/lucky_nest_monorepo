import { Injectable } from '@nestjs/common';
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
import { PaymentService } from '@api/client/payment/payment.service';

@Injectable()
export class ClientWalletService {
  constructor(
    private prismaService: PrismaService,
    private walletService: WalletService,
    private paymentService: PaymentService,
  ) {}

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
          desc: RelatedType.WITHDRAWAL,
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
    let paymentUrl: string;
    try {
      paymentUrl = await this.paymentService.createRechargeLink(
        order.rechargeNo,
        amount.toNumber(),
        // user.email,
      );
    } catch (e) {
      // In case of failure, we might want to handle it (e.g., log, cleanup)
      throw e;
    }
    // return { payUrl: order.payUrl, orderId: order.rechargeId };
    return {
      rechargeNo: order.rechargeNo,
      rechargeAmount: order.rechargeAmount.toString(),
      payUrl: paymentUrl,
      rechargeStatus: order.rechargeStatus,
    };
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
