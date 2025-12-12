/*
  Warnings:

  - You are about to drop the column `coupon_id` on the `orders` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_coupon_id]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "coupon_id",
ADD COLUMN     "user_coupon_id" VARCHAR(32);

-- CreateTable
CREATE TABLE "coupons" (
    "coupon_id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "coupon_name" VARCHAR(200) NOT NULL,
    "coupon_code" VARCHAR(50),
    "coupon_type" SMALLINT NOT NULL,
    "discount_type" SMALLINT NOT NULL DEFAULT 1,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "min_purchase_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "max_discount_amount" DECIMAL(10,2),
    "issue_type" SMALLINT NOT NULL DEFAULT 2,
    "total_quantity" INTEGER NOT NULL DEFAULT -1,
    "issued_quantity" INTEGER NOT NULL DEFAULT 0,
    "per_user_limit" INTEGER NOT NULL DEFAULT 1,
    "valid_type" SMALLINT NOT NULL DEFAULT 1,
    "valid_days" INTEGER,
    "valid_start_time" TIMESTAMP(3),
    "valid_end_time" TIMESTAMP(3),
    "status" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("coupon_id")
);

-- CreateTable
CREATE TABLE "user_coupons" (
    "user_coupon_id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" VARCHAR(32) NOT NULL,
    "coupon_id" VARCHAR(32) NOT NULL,
    "receive_type" SMALLINT NOT NULL DEFAULT 2,
    "use_status" SMALLINT NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(10,2),
    "used_at" TIMESTAMP(3),
    "valid_start_time" TIMESTAMP(3) NOT NULL,
    "valid_end_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_coupons_pkey" PRIMARY KEY ("user_coupon_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coupons_coupon_code_key" ON "coupons"("coupon_code");

-- CreateIndex
CREATE INDEX "coupons_status_idx" ON "coupons"("status");

-- CreateIndex
CREATE INDEX "coupons_issue_type_idx" ON "coupons"("issue_type");

-- CreateIndex
CREATE INDEX "coupons_valid_start_time_valid_end_time_idx" ON "coupons"("valid_start_time", "valid_end_time");

-- CreateIndex
CREATE INDEX "user_coupons_user_id_use_status_idx" ON "user_coupons"("user_id", "use_status");

-- CreateIndex
CREATE INDEX "user_coupons_valid_end_time_idx" ON "user_coupons"("valid_end_time");

-- CreateIndex
CREATE UNIQUE INDEX "orders_user_coupon_id_key" ON "orders"("user_coupon_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_coupon_id_fkey" FOREIGN KEY ("user_coupon_id") REFERENCES "user_coupons"("user_coupon_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_coupons" ADD CONSTRAINT "user_coupons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_coupons" ADD CONSTRAINT "user_coupons_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("coupon_id") ON DELETE CASCADE ON UPDATE CASCADE;
