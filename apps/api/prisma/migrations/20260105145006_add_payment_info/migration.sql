-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "payment_method" SMALLINT,
ADD COLUMN     "transaction_id" VARCHAR(100);
