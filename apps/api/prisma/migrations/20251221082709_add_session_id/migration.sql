/*
  Warnings:

  - A unique constraint covering the columns `[session_id]` on the table `kyc_records` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."kyc_records_kyc_status_idx";

-- AlterTable
ALTER TABLE "kyc_records" ADD COLUMN     "session_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "kyc_records_session_id_key" ON "kyc_records"("session_id");
