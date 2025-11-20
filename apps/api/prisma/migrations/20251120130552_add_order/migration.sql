/*
  Warnings:

  - The primary key for the `wallet_transactions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `wallet_transactions` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - You are about to alter the column `transaction_no` on the `wallet_transactions` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `user_id` on the `wallet_transactions` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - You are about to alter the column `wallet_id` on the `wallet_transactions` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - You are about to alter the column `transaction_type` on the `wallet_transactions` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `balance_type` on the `wallet_transactions` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `amount` on the `wallet_transactions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `related_id` on the `wallet_transactions` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(64)`.
  - You are about to alter the column `related_type` on the `wallet_transactions` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `status` on the `wallet_transactions` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.

*/
-- DropForeignKey
ALTER TABLE "public"."wallet_transactions" DROP CONSTRAINT "wallet_transactions_wallet_id_fkey";

-- AlterTable
ALTER TABLE "wallet_transactions" DROP CONSTRAINT "wallet_transactions_pkey",
ADD COLUMN     "remark" VARCHAR(500),
ADD COLUMN     "transaction_id_ext" VARCHAR(32),
ALTER COLUMN "id" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "transaction_no" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "user_id" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "wallet_id" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "transaction_type" SET DATA TYPE SMALLINT,
ALTER COLUMN "balance_type" SET DATA TYPE SMALLINT,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "related_id" SET DATA TYPE VARCHAR(64),
ALTER COLUMN "related_type" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "status" SET DATA TYPE SMALLINT,
ADD CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "orders" (
    "order_id" VARCHAR(32) NOT NULL,
    "order_no" VARCHAR(50) NOT NULL,
    "user_id" VARCHAR(32) NOT NULL,
    "treasure_id" VARCHAR(32) NOT NULL,
    "original_amount" DECIMAL(10,2) NOT NULL,
    "discount_amount" DECIMAL(10,2) NOT NULL,
    "coupon_amount" DECIMAL(10,2) NOT NULL,
    "coin_amount" DECIMAL(10,2) NOT NULL,
    "final_amount" DECIMAL(10,2) NOT NULL,
    "buy_quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "order_status" SMALLINT NOT NULL DEFAULT 1,
    "pay_status" SMALLINT NOT NULL DEFAULT 0,
    "refund_status" SMALLINT NOT NULL DEFAULT 0,
    "group_id" VARCHAR(32),
    "is_group_owner" SMALLINT NOT NULL DEFAULT 0,
    "coupon_id" VARCHAR(32),
    "coin_used" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paid_at" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_no_key" ON "orders"("order_no");

-- CreateIndex
CREATE INDEX "idx_user_id_order" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "idx_treasure_id_order" ON "orders"("treasure_id");

-- CreateIndex
CREATE INDEX "idx_order_status" ON "orders"("order_status", "pay_status");

-- CreateIndex
CREATE INDEX "idx_group_id_order" ON "orders"("group_id");

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "user_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_treasure_id_fkey" FOREIGN KEY ("treasure_id") REFERENCES "treasures"("treasure_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "treasure_groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;
