-- DropIndex
DROP INDEX "public"."OtpRequest_phone_purpose_expiresAt_idx";

-- AlterTable
ALTER TABLE "OtpRequest" ADD COLUMN     "consumedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "OtpRequest_phone_purpose_expiresAt_consumedAt_idx" ON "OtpRequest"("phone", "purpose", "expiresAt", "consumedAt");
