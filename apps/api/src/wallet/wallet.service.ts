import {BadRequestException, Injectable} from "@nestjs/common";
import {PrismaService} from "@api/prisma/prisma.service";
import {Prisma} from "@prisma/client";
import {BALANCE_TYPE, TRANSACTION_STATUS, TRANSACTION_TYPE} from "@lucky/shared/dist/types/wallet";
import {BizException, throwBiz} from "@api/common/exceptions/biz.exception";
import {ERROR_KEYS} from "@api/common/error-codes.gen";

const D = (n: number | string) => new Prisma.Decimal(n);

@Injectable()
export class WalletService {
    constructor(private prisma: PrismaService) {
    }

    // balance inquiry for the given userId
    async balance(userId: string) {
        return this.prisma.userWallet.upsert({
            where: {userId},
            create: {userId},
            update: {},
            select: {
                userId: true,
                realBalance: true,
                totalRecharge: true,
                coinBalance: true,
                frozenBalance: true,
                totalWithdraw: true,
            }
        })
    }

    // Ensure a wallet exists for the given userId
    async ensureWallet(userId: string) {
        await this.prisma.userWallet.upsert({
            where: {userId},
            create: {userId},
            update: {}
        })
    }

    // recharge the wallet of the given userId by the specified amount
    async creditCash(params: {
        userId: string,
        amount: number | string,
        related?: { id: string, type: string },
        desc?: string
    }) {
        const {userId, amount, related, desc} = params
        const amt = D(amount);

        if (amt.lte(0)) throw new BadRequestException('amount must be positive');

        return this.prisma.$transaction(async (tx) => {
            //check wallet exists
            await this.prisma.userWallet.upsert({where: {userId}, create: {userId}, update: {}});

            // add balance + sum new balance
            const w = await tx.userWallet.update({
                where: {userId},
                data: {
                    realBalance: {increment: amt},
                    totalRecharge: {increment: amt}
                },
                select: {id: true, userId: true, realBalance: true}
            })

            // log transaction（positive=deposit）
            const txn = await tx.walletTransaction.create({
                data: {
                    transactionNo: this.genTxnNo(),
                    userId,
                    walletId: w.id,
                    transactionType: TRANSACTION_TYPE.RECHARGE,
                    balanceType: BALANCE_TYPE.CASH,
                    amount: amt,
                    relatedId: related?.id,
                    relatedType: related?.type,
                    description: desc,
                    status: TRANSACTION_STATUS.SUCCESS
                }
            });
            return {balance: w.realBalance, transaction: txn.transactionNo};
        });

    }

    // deduct amount from the wallet of the given userId
    async debitCash(params:{
        userId: string,
        amount: number | string,
        related?: { id: string, type: string },
        desc?: string
    }){
        const {userId, amount, related, desc} = params
        const amt = D(amount);

        if (amt.lte(0)) throw new BadRequestException('amount must be positive');

        return this.prisma.$transaction(async  (tx) => {
            //check wallet exists
            await this.prisma.userWallet.upsert({where: {userId}, create: {userId}, update: {}});
            // deduct balance + sum new balance
            const r = await tx.userWallet.updateMany({
                where: {userId, realBalance: {gte: amt}},
                data: {realBalance: { decrement: amt}}
            });

            if (r.count === 0) {
               throwBiz(ERROR_KEYS.INSUFFICIENT_BALANCE)
            }

            const w = await tx.userWallet.findUniqueOrThrow({
                where: {userId},
                select: {id: true, userId: true, realBalance: true}
            });

            // log transaction（negative=withdraw）
            const txn = await tx.walletTransaction.create({
                data: {
                    transactionNo: this.genTxnNo(),
                    userId,
                    walletId: w.id,
                    transactionType: TRANSACTION_TYPE.WITHDRAWAL,
                    balanceType: BALANCE_TYPE.CASH,
                    amount: amt.neg(), // negative amount for debit
                    relatedId: related?.id,
                    relatedType: related?.type,
                    description: desc,
                    status: TRANSACTION_STATUS.SUCCESS
                }
            });
            return {balance: w.realBalance, transaction: txn.transactionNo};

        });
    }

    // generate a unique transaction number
    private genTxnNo() {
        const d = new Date();
        const pad = (n: number, w = 2) => String(n).padStart(w, '0');
        const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(
            d.getMinutes(),
        )}${pad(d.getSeconds())}${String(d.getMilliseconds()).padStart(3, '0')}`;
        return `TXN${ts}${Math.floor(Math.random() * 1000)}`;
    }
}