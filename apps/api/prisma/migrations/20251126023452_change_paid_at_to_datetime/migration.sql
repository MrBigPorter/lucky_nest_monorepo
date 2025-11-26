/*
  Warnings:

  - The `paid_at` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "orders"
   ALTER COLUMN "paid_at" TYPE TIMESTAMP(3)
  USING to_timestamp("paid_at" / 1000.0)::timestamp(3);