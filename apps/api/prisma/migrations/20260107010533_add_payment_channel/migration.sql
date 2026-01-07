-- AlterTable
ALTER TABLE "recharge_orders" ADD COLUMN     "channel_code" VARCHAR(50),
ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "fee_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "pay_url" TEXT;

-- AlterTable
ALTER TABLE "withdraw_orders" ADD COLUMN     "channel_code" VARCHAR(50);

-- CreateTable
CREATE TABLE "payment_channels" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(255),
    "type" SMALLINT NOT NULL DEFAULT 1,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'PHP',
    "min_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "max_amount" DECIMAL(10,2) NOT NULL DEFAULT 50000,
    "fixed_amounts" JSONB,
    "is_custom" BOOLEAN NOT NULL DEFAULT true,
    "fee_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "fee_fixed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_channels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_channels_code_key" ON "payment_channels"("code");

-- CreateIndex
CREATE INDEX "payment_channels_type_status_idx" ON "payment_channels"("type", "status");
