-- AlterTable
ALTER TABLE "wallet_transactions" ADD COLUMN     "after_balance" DECIMAL(10,2),
ADD COLUMN     "before_balance" DECIMAL(10,2);
