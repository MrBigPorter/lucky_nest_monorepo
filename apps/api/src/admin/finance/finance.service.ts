import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { QueryTransactionDto } from '@api/admin/finance/dto/query-transaction.dto';
import { Prisma } from '@prisma/client';
import {
  BALANCE_TYPE,
  BizPrefix,
  DIRECTION,
  OpAction,
  OpModule,
  OrderNoHelper,
  RelatedType,
  TimeHelper,
  TRANSACTION_STATUS,
  WITHDRAW_STATUS,
} from '@lucky/shared';
import { ManualAdjustmentDto } from '@api/admin/finance/dto/manual-adjustment.dto';
import { TRANSACTION_TYPE } from '@lucky/shared';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/edge';
import { QueryWithdrawalsDto } from '@api/admin/finance/dto/query-withdrawals.dto';
import { AuditWithdrawDto } from '@api/admin/finance/dto/audit-withdraw.dto';

@Injectable()
export class FinanceService {
  constructor(private prismaService: PrismaService) {}

  /**
   * Get a paginated list of wallet transactions with optional filters
   * @param dto
   * @returns Paginated list of wallet transactions
   */
  async getTransactions(dto: QueryTransactionDto) {
    const { page, pageSize, userId, type, startDate, endDate } = dto;
    const skip = (page - 1) * pageSize;

    // Build dynamic where conditions based on provided filters
    const whereConditions: Prisma.WalletTransactionScalarWhereInput = {};

    if (type) {
      whereConditions.transactionType = type;
    }
    if (userId) {
      whereConditions.userId = userId;
    }
    if (startDate || endDate) {
      whereConditions.createdAt = {
        ...(startDate ? { gte: TimeHelper.getStartOfDay(startDate) } : {}),
        ...(endDate ? { lte: TimeHelper.getEndOfDay(endDate) } : {}),
      };
    }
    const [list, total] = await this.prismaService.$transaction([
      this.prismaService.walletTransaction.findMany({
        where: whereConditions,
        skip: skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        // Include user details
        include: {
          user: {
            select: {
              nickname: true,
              phone: true,
            },
          },
        },
      }),
      this.prismaService.walletTransaction.count({
        where: whereConditions,
      }),
    ]);

    return { list, total, page, pageSize };
  }

  /**
   * Manually adjust user wallet balance
   * 人工调账 (Manual Adjust) - 金融级安全
   * @param dto
   * @param query
   *
   */
  async manualAdjust(
    dto: ManualAdjustmentDto,
    query: {
      adminId: string;
      ip: string;
    },
  ) {
    const { userId, amount: amountNum, actionType, balanceType, remark } = dto;

    // ：精度安全 - 入口处立刻转为 Decimal
    const amount = new Prisma.Decimal(amountNum);

    // 强一致性事务
    return this.prismaService.$transaction(async (ctx) => {
      const adminUser = await ctx.adminUser.findUnique({
        where: { id: userId },
      });

      if (!adminUser) {
        throw new NotFoundException('User not found');
      }

      // 获取钱包ID
      const wallet = await ctx.userWallet.findUnique({ where: { userId } });
      if (!wallet) {
        throw new NotFoundException('User wallet not found');
      }
      let updatedWallet;
      const isRealBalance = balanceType === BALANCE_TYPE.CASH;

      // 2. 执行原子更新 + 并发防御
      try {
        if (actionType === DIRECTION.INCOME) {
          // 📈 加币 (Increase) - 直接原子增加
          updatedWallet = await ctx.userWallet.update({
            where: { userId },
            data: {
              realBalance: isRealBalance ? { increment: amount } : undefined,
              coinBalance: !isRealBalance ? { increment: amount } : undefined,
            },
          });
        } else {
          // debit
          updatedWallet = await ctx.userWallet.update({
            where: {
              userId,
              // 只有当余额 >= 扣款金额时，才允许执行 decrement
              // 这利用了数据库行级锁，防止并发扣成负数
              [isRealBalance ? 'realBalance' : 'coinBalance']: { gte: amount },
            },
            data: {
              realBalance: isRealBalance ? { decrement: amount } : undefined,
              coinBalance: !isRealBalance ? { decrement: amount } : undefined,
            },
          });
        }
      } catch (error) {
        // 异常捕获 P2025
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new NotFoundException(
            'User wallet not found or insufficient balance',
          );
        }
        throw error;
      }

      //计算变动前后的余额 (用于审计记录)
      const currentBalance = isRealBalance
        ? updatedWallet.realBalance
        : updatedWallet.coinBalance;

      // 倒推：如果是加币，变动前 = 当前 - amount；如果是扣币，变动前 = 当前 + amount
      const beforeBalance =
        actionType === DIRECTION.INCOME
          ? currentBalance.minus(amount)
          : currentBalance.plus(amount);

      const transType =
        actionType === DIRECTION.INCOME
          ? TRANSACTION_TYPE.REWARD
          : TRANSACTION_TYPE.SYSTEM_DEDUCT;

      //  双向记账 (写入流水)
      // 收入记正数，支出记负数
      const logAmount =
        actionType === DIRECTION.INCOME ? amount : amount.negated();
      await ctx.walletTransaction.create({
        data: {
          transactionNo: OrderNoHelper.generate(BizPrefix.ADJUST),
          userId,
          walletId: wallet.id,
          transactionType: transType,
          balanceType,
          amount: logAmount,
          beforeBalance,
          afterBalance: currentBalance,
          description: remark,
          status: TRANSACTION_STATUS.SUCCESS,
        },
      });

      // 5. 记录管理员操作日志
      await ctx.adminOperationLog.create({
        data: {
          adminId: query.adminId,
          adminName: adminUser.username,
          module: OpModule.FINANCE,
          action: OpAction.FINANCE.MANUAL_ADJUST,
          details: `User: ${userId}, Amount: ${logAmount.toString()}, Type: ${balanceType}`,
          requestIp: query.ip,
        },
      });
      return updatedWallet;
    });
  }

  /**
   * Get a paginated list of withdrawal orders with optional filters
   * @param dto
   * @returns Paginated list of withdrawal orders
   */
  async getWithdrawals(dto: QueryWithdrawalsDto) {
    const { page, pageSize, status, keyword, startDate, endDate } = dto;
    const skip = (page - 1) * pageSize;
    const whereConditions: Prisma.WithdrawOrderWhereInput = {};

    if (status) {
      whereConditions.withdrawStatus = status;
    }

    if (startDate || endDate) {
      whereConditions.createdAt = {
        ...(startDate ? { gte: TimeHelper.getStartOfDay(startDate) } : {}),
        ...(endDate ? { lte: TimeHelper.getEndOfDay(endDate) } : {}),
      };
    }

    if (keyword) {
      whereConditions.OR = [
        { withdrawNo: { contains: keyword } },
        { user: { nickname: { contains: keyword } } },
        { user: { phone: { contains: keyword } } },
        { userId: keyword },
      ];
    }

    const [list, total] = await this.prismaService.$transaction([
      this.prismaService.withdrawOrder.findMany({
        where: whereConditions,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              nickname: true,
              phone: true,
            },
          },
        },
      }),
      this.prismaService.withdrawOrder.count({
        where: whereConditions,
      }),
    ]);
    return { list, total, page, pageSize };
  }

  /**
   * Audit a withdrawal order
   * @param dto
   * @param adminId
   */
  async auditWithdraw(dto: AuditWithdrawDto, adminId: string) {
    const { withdrawId, remark, status } = dto;
    return this.prismaService.$transaction(async (ctx) => {
      // 1. 获取提现订单
      const order = await ctx.withdrawOrder.findUnique({
        where: { withdrawId },
      });
      if (!order) {
        throw new NotFoundException('Withdrawal order not found');
      }

      // 2. 检查订单状态 - 只能审核待审核状态的订单
      if (order.withdrawStatus !== WITHDRAW_STATUS.PENDING_AUDIT) {
        throw new BadRequestException(
          'the order is already audited, cannot be audited again',
        );
      }

      // 3. 获取用户钱包
      const wallet = await ctx.userWallet.findUnique({
        where: { userId: order.userId },
      });

      // 4. 根据审核结果处理资金流转
      if (!wallet) {
        throw new NotFoundException('User wallet not found');
      }

      const amount = new Prisma.Decimal(order.withdrawAmount);

      // 审核通过 (Approve) -> 扣除冻结资金 (frozenBalance -> totalWithdraw)
      if (status === WITHDRAW_STATUS.SUCCESS) {
        try {
          await ctx.userWallet.update({
            where: {
              userId: order.userId,
              // 确保有足够的冻结余额
              frozenBalance: { gte: amount },
            },
            data: {
              frozenBalance: { decrement: amount }, // 扣除冻结余额
              totalWithdraw: { increment: amount }, // 增加总提现金额
            },
          });
        } catch (error) {
          if (
            error instanceof PrismaClientKnownRequestError &&
            error.code === 'P2025'
          ) {
            throw new BadRequestException(
              'system error: insufficient frozen balance',
            );
          }
        }

        // 记录提现成功流水, 记账为支出
        await ctx.walletTransaction.updateMany({
          where: {
            relatedId: order.withdrawId,
            relatedType: RelatedType.WITHDRAWAL,
            status: TRANSACTION_STATUS.PROCESSING,
          },
          data: {
            status: TRANSACTION_STATUS.SUCCESS,
            description: 'wallet withdrawal approved and completed',
            remark: `Audit Approved by ${adminId}`,
            updatedAt: new Date(),
          },
        });
      } else {
        //  审核拒绝 (Reject) -> 解冻资金 (frozen -> realBalance)
        //  拒绝通常不产生支出流水，资金只是退回
        try {
          await ctx.userWallet.update({
            where: {
              userId: order.userId,
              frozenBalance: { gte: amount }, // 确保有足够的冻结余额
            },
            data: {
              frozenBalance: { decrement: amount }, // 解冻,减少冻结余额
              realBalance: { increment: amount }, // 返还到可用余额
            },
          });
        } catch (error) {
          if (
            error instanceof PrismaClientKnownRequestError &&
            error.code === 'P2025'
          ) {
            throw new BadRequestException(
              'system error: insufficient frozen balance',
            );
          }
          throw error;
        }

        await ctx.walletTransaction.create({
          data: {
            transactionNo: OrderNoHelper.generate(BizPrefix.WITHDRAW),
            userId: order.userId,
            walletId: wallet.id,
            transactionType: TRANSACTION_TYPE.REFUND, // 提现拒绝
            balanceType: BALANCE_TYPE.CASH, // 现金余额
            amount: amount, // 返还记正数
            beforeBalance: wallet.realBalance, // 变动前余额
            afterBalance: wallet.realBalance.plus(amount), // 变动后余额
            description: 'wallet withdrawal rejected, funds returned',
            status: TRANSACTION_STATUS.SUCCESS,
            relatedId: order.withdrawId,
            relatedType: RelatedType.WITHDRAWAL,
            remark: `Audit Rejected by ${adminId}`,
          },
        });
      }

      // 5. 更新提现订单状态
      return ctx.withdrawOrder.update({
        where: { withdrawId },
        data: {
          withdrawStatus: status,
          auditResult: remark,
          rejectReason: status === WITHDRAW_STATUS.REJECTED ? remark : null,
          auditorId: adminId,
          auditedAt: new Date(),
          completedAt: status === WITHDRAW_STATUS.SUCCESS ? new Date() : null,
        },
      });
    });
  }
}
