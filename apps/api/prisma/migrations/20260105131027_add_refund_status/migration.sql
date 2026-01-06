-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "refund_amount" DECIMAL(10,2),
ADD COLUMN     "refund_reason" VARCHAR(255),
ADD COLUMN     "refunded_at" TIMESTAMP(3);
