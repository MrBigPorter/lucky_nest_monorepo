-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "refund_applied_by" TEXT,
ADD COLUMN     "refund_audited_by" TEXT,
ADD COLUMN     "refund_reject_reason" TEXT;
