-- CreateTable
CREATE TABLE "recharge_orders" (
    "recharge_id" VARCHAR(32) NOT NULL,
    "recharge_no" VARCHAR(50) NOT NULL,
    "user_id" VARCHAR(32) NOT NULL,
    "recharge_amount" DECIMAL(10,2) NOT NULL,
    "bonus_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "actual_amount" DECIMAL(10,2) NOT NULL,
    "payment_method" SMALLINT NOT NULL,
    "payment_channel" VARCHAR(50),
    "payment_id" VARCHAR(32),
    "recharge_status" SMALLINT NOT NULL DEFAULT 1,
    "activity_id" VARCHAR(32),
    "first_recharge" SMALLINT NOT NULL DEFAULT 0,
    "third_party_order_no" VARCHAR(100),
    "callback_data" JSONB,
    "paid_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recharge_orders_pkey" PRIMARY KEY ("recharge_id")
);

-- CreateTable
CREATE TABLE "withdraw_orders" (
    "withdraw_id" VARCHAR(32) NOT NULL,
    "withdraw_no" VARCHAR(50) NOT NULL,
    "user_id" VARCHAR(32) NOT NULL,
    "withdraw_amount" DECIMAL(10,2) NOT NULL,
    "fee_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "actual_amount" DECIMAL(10,2) NOT NULL,
    "withdraw_method" SMALLINT NOT NULL,
    "withdraw_account" VARCHAR(100) NOT NULL,
    "account_name" VARCHAR(100),
    "bank_name" VARCHAR(100),
    "withdraw_status" SMALLINT NOT NULL DEFAULT 1,
    "audit_result" VARCHAR(500),
    "reject_reason" VARCHAR(500),
    "auditor_id" VARCHAR(32),
    "third_party_order_no" VARCHAR(100),
    "transfer_voucher" VARCHAR(255),
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "audited_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdraw_orders_pkey" PRIMARY KEY ("withdraw_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recharge_orders_recharge_no_key" ON "recharge_orders"("recharge_no");

-- CreateIndex
CREATE INDEX "recharge_orders_user_id_idx" ON "recharge_orders"("user_id");

-- CreateIndex
CREATE INDEX "recharge_orders_recharge_no_idx" ON "recharge_orders"("recharge_no");

-- CreateIndex
CREATE INDEX "recharge_orders_recharge_status_idx" ON "recharge_orders"("recharge_status");

-- CreateIndex
CREATE UNIQUE INDEX "withdraw_orders_withdraw_no_key" ON "withdraw_orders"("withdraw_no");

-- CreateIndex
CREATE INDEX "withdraw_orders_user_id_idx" ON "withdraw_orders"("user_id");

-- CreateIndex
CREATE INDEX "withdraw_orders_withdraw_no_idx" ON "withdraw_orders"("withdraw_no");

-- CreateIndex
CREATE INDEX "withdraw_orders_withdraw_status_idx" ON "withdraw_orders"("withdraw_status");

-- AddForeignKey
ALTER TABLE "recharge_orders" ADD CONSTRAINT "recharge_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdraw_orders" ADD CONSTRAINT "withdraw_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
