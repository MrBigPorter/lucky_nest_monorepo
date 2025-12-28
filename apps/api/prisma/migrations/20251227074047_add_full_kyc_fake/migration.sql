/*
  Warnings:

  - You are about to drop the column `is_fake` on the `kyc_records` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "kyc_records" DROP COLUMN "is_fake";
