import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  BALANCE_TYPE,
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
} from '@lucky/shared/dist/types/wallet';
import { throwBiz } from '@api/common/exceptions/biz.exception';
import { ERROR_KEYS } from '@api/common/error-codes.gen';
import { BizPrefix, OrderNoHelper } from '@lucky/shared';

const D = (n: number | string | Prisma.Decimal) => new Prisma.Decimal(n);
type Tx = Prisma.TransactionClient | PrismaService;

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  // Get ORM instance, either transaction or main prisma
  private orm(tx?: Tx) {
    return (tx ?? this.prisma) as any;
  }

  // Ensure a wallet exists for the given userId
  async ensureWallet(userId: string, tx?: Tx) {
    const db = this.orm(tx);

    return await db.userWallet.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: {
        id: true,
        userId: true,
        realBalance: true,
        coinBalance: true,
        totalRecharge: true,
        frozenBalance: true,
        totalWithdraw: true,
      },
    });
  }

  // balance inquiry for the given userId
  async balance(userId: string, tx?: Tx) {
    const db = this.orm(tx);

    return db.userWallet.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: {
        id: true,
        userId: true,
        realBalance: true,
        totalRecharge: true,
        coinBalance: true,
        frozenBalance: true,
        totalWithdraw: true,
      },
    });
  }

  // recharge the wallet of the given userId by the specified amount
  async creditCash(
    params: {
      userId: string;
      amount: number | string | Prisma.Decimal;
      related?: { id: string; type: string };
      desc?: string;
    },
    tx?: Tx,
  ) {
    const db = this.orm(tx);
    const { userId, amount, related, desc } = params;
    const amt = D(amount);

    if (amt.lte(0)) throw new BadRequestException('amount must be positive');

    const snap = await this.ensureWallet(userId, db);
    const before = D(snap.realBalance ?? 0);

    await db.userWallet.update({
      where: { userId },
      data: {
        realBalance: { increment: amt },
        totalRecharge: { increment: amt },
      },
    });

    const after = before.add(amt);

    const txn = await db.walletTransaction.create({
      data: {
        transactionNo: OrderNoHelper.generate(BizPrefix.TRANSFER),
        userId,
        walletId: snap.id,
        transactionType: TRANSACTION_TYPE.RECHARGE,
        balanceType: BALANCE_TYPE.CASH,
        amount: amt,
        beforeBalance: before,
        afterBalance: after,
        relatedId: related?.id,
        relatedType: related?.type,
        description: desc,
        status: TRANSACTION_STATUS.SUCCESS,
      },
      select: {
        id: true,
      },
    });

    return { realBalance: after, transactionId: txn.id };
  }

  // deduct amount from the wallet of the given userId
  async debitCash(
    params: {
      userId: string;
      amount: number | string | Prisma.Decimal;
      related?: { id: string; type: string };
      desc?: string;
    },
    tx?: Tx,
  ): Promise<{ realBalance: Prisma.Decimal; transactionId: string }> {
    const db = this.orm(tx);
    const { userId, amount, related, desc } = params;
    const amt = D(amount);

    if (amt.lte(0)) throw new BadRequestException('amount must be positive');

    const snap = await this.ensureWallet(userId, db);
    const before = D(snap.realBalance ?? 0);

    const r = await db.userWallet.updateMany({
      where: { userId, realBalance: { gte: amt } },
      data: {
        realBalance: { decrement: amt },
      },
    });

    if (r.count !== 1) {
      throwBiz(ERROR_KEYS.INSUFFICIENT_BALANCE);
    }

    const after = before.sub(amt);

    const txn = await db.walletTransaction.create({
      data: {
        transactionNo: OrderNoHelper.generate(BizPrefix.TRANSFER),
        userId,
        walletId: snap.id,
        transactionType: TRANSACTION_TYPE.CONSUMPTION,
        balanceType: BALANCE_TYPE.CASH,
        amount: amt.neg(), // negative amount for debit
        beforeBalance: before,
        afterBalance: after,
        relatedId: related?.id ?? null,
        relatedType: related?.type ?? 'order',
        description: desc ?? 'spend',
        status: TRANSACTION_STATUS.SUCCESS,
      },
      select: {
        id: true,
      },
    });

    return { realBalance: after, transactionId: txn.id };
  }

  // coin credit
  async creditCoin(
    params: {
      userId: string;
      coins: number | string;
      related?: { id: string; type: string };
      desc?: string;
    },
    tx?: Tx,
  ): Promise<{ coinBalance: Prisma.Decimal; transactionId: string }> {
    const db = this.orm(tx);
    const { userId, coins, related, desc } = params;
    const amt = D(coins);

    if (amt.lte(0)) throw new BadRequestException('coins must be positive');

    const snap = await this.ensureWallet(userId, db);
    const before = D(snap.coinBalance ?? 0);

    await db.userWallet.update({
      where: { userId },
      data: {
        coinBalance: { increment: amt },
      },
    });

    const after = before.add(amt);

    const txn = await db.walletTransaction.create({
      data: {
        transactionNo: OrderNoHelper.generate(BizPrefix.TRANSFER),
        userId,
        walletId: snap.id,
        transactionType: TRANSACTION_TYPE.REWARD,
        balanceType: BALANCE_TYPE.COIN,
        amount: amt,
        beforeBalance: before,
        afterBalance: after,
        relatedId: related?.id ?? null,
        relatedType: related?.type ?? null,
        description: desc ?? 'coin credit',
        status: TRANSACTION_STATUS.SUCCESS,
      },
      select: {
        id: true,
      },
    });
    return { coinBalance: after, transactionId: txn.id };
  }

  // coin debit
  async debitCoin(
    params: {
      userId: string;
      coins: number | string | Prisma.Decimal;
      related?: { id: string; type: string };
      desc?: string;
    },
    tx?: Tx,
  ): Promise<{ coinBalance: Prisma.Decimal; transactionId: string }> {
    const db = this.orm(tx);
    const { userId, coins, related, desc } = params;
    const amt = D(coins);

    if (amt.lte(0)) throw new BadRequestException('coins must be positive');

    const snap = await this.ensureWallet(userId, db);
    const before = D(snap.coinBalance ?? 0);
    const r = await db.userWallet.updateMany({
      where: { userId, coinBalance: { gte: amt } },
      data: {
        coinBalance: { decrement: amt },
      },
    });

    if (r.count !== 1) {
      throw new BadRequestException('insufficient coin balance');
    }

    const after = before.sub(amt);

    const txn = await db.walletTransaction.create({
      data: {
        transactionNo: OrderNoHelper.generate(BizPrefix.TRANSFER),
        userId,
        walletId: snap.id,
        transactionType: TRANSACTION_TYPE.COIN_EXCHANGE,
        balanceType: BALANCE_TYPE.COIN,
        amount: amt.neg(), // negative amount for debit
        beforeBalance: before,
        afterBalance: after,
        relatedId: related?.id ?? null,
        relatedType: related?.type ?? 'order',
        description: desc ?? 'coin debit',
        status: TRANSACTION_STATUS.SUCCESS,
      },
      select: {
        id: true,
      },
    });
    return { coinBalance: after, transactionId: txn.id };
  }

  /**
   * Freeze cash amount for withdrawal
   * @param params
   * @param tx
   */
  async freezeCash(
    params: {
      userId: string;
      amount: number | string | Prisma.Decimal;
      related?: { id: string; type: string };
      desc?: string;
    },
    tx?: Tx,
  ) {
    const db = this.orm(tx);
    const { userId, amount, related, desc } = params;
    const amt = D(amount);

    if (amt.lte(0)) throw new BadRequestException('amount must be positive');

    const snap = await this.ensureWallet(userId, db);
    const beforeReal = D(snap.realBalance ?? 0);

    const res = await db.userWallet.updateMany({
      where: { userId, realBalance: { gte: amt } },
      data: {
        realBalance: { decrement: amt },
        frozenBalance: { increment: amt },
      },
    });

    if (res.count !== 1) {
      throwBiz(ERROR_KEYS.INSUFFICIENT_BALANCE);
    }

    const afterReal = beforeReal.sub(amt);

    const txn = await db.walletTransaction.create({
      data: {
        transactionNo: OrderNoHelper.generate(BizPrefix.TRANSFER),
        userId,
        walletId: snap.id,
        transactionType: TRANSACTION_TYPE.WITHDRAWAL,
        balanceType: BALANCE_TYPE.CASH,
        amount: amt.neg(),
        beforeBalance: beforeReal,
        afterBalance: afterReal,
        relatedId: related?.id,
        relatedType: related?.type,
        description: desc ?? 'Frozen for withdrawal',
        status: TRANSACTION_STATUS.SUCCESS,
      },
      select: {
        id: true,
      },
    });

    return { realBalance: afterReal, transactionId: txn.id };
  }

  async unfreezeCash(
    params: {
      userId: string;
      amount: number | string | Prisma.Decimal;
      related?: { id: string; type: string };
      desc?: string;
    },
    tx?: Tx,
  ) {
    const db = this.orm(tx);
    const { userId, amount, related, desc } = params;
    const amt = D(amount);

    if (amt.lte(0)) throw new BadRequestException('amount must be positive');

    const snap = await this.ensureWallet(userId, db);
    const beforeFrozen = D(snap.frozenBalance ?? 0);

    const res = await db.userWallet.updateMany({
      where: { userId, frozenBalance: { gte: amt } },
      data: {
        frozenBalance: { decrement: amt },
        realBalance: { increment: amt },
      },
    });

    if (res.count !== 1) {
      throwBiz(ERROR_KEYS.INSUFFICIENT_BALANCE);
    }

    const afterFrozen = beforeFrozen.sub(amt);

    const txn = await db.walletTransaction.create({
      data: {
        transactionNo: OrderNoHelper.generate(BizPrefix.TRANSFER),
        userId,
        walletId: snap.id,
        transactionType: TRANSACTION_TYPE.REFUND,
        balanceType: BALANCE_TYPE.CASH,
        amount: amt,
        beforeBalance: beforeFrozen,
        afterBalance: afterFrozen,
        relatedId: related?.id,
        relatedType: related?.type,
        description: desc ?? 'Unfrozen from withdrawal',
        status: TRANSACTION_STATUS.SUCCESS,
      },
      select: {
        id: true,
      },
    });

    return { frozenBalance: afterFrozen, transactionId: txn.id };
  }
}
