/*
  Warnings:

  - Made the column `after_balance` on table `wallet_transactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `before_balance` on table `wallet_transactions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "wallet_transactions" ALTER COLUMN "after_balance" SET NOT NULL,
ALTER COLUMN "before_balance" SET NOT NULL;
