/*
  Warnings:

  - You are about to drop the column `ocr_raw_data` on the `kyc_records` table. All the data in the column will be lost.
  - You are about to drop the column `verify_result` on the `kyc_records` table. All the data in the column will be lost.
  - You are about to drop the column `video_url` on the `kyc_records` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."kyc_records_device_id_idx";

-- AlterTable
ALTER TABLE "kyc_records" DROP COLUMN "ocr_raw_data",
DROP COLUMN "verify_result",
DROP COLUMN "video_url",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "asset_proof" VARCHAR(255),
ADD COLUMN     "barangay" VARCHAR(100),
ADD COLUMN     "birthday" TIMESTAMP(3),
ADD COLUMN     "city" VARCHAR(100),
ADD COLUMN     "country_code" INTEGER,
ADD COLUMN     "current_address_json" JSONB,
ADD COLUMN     "expiry_date" TIMESTAMP(3),
ADD COLUMN     "first_name" VARCHAR(50),
ADD COLUMN     "gender" VARCHAR(10),
ADD COLUMN     "is_fake" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_same_address" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_name" VARCHAR(50),
ADD COLUMN     "middle_name" VARCHAR(50),
ADD COLUMN     "optional_photo" VARCHAR(255),
ADD COLUMN     "postal_code" VARCHAR(20),
ADD COLUMN     "province" VARCHAR(100),
ADD COLUMN     "security_flags" JSONB,
ADD COLUMN     "selfie_photo" VARCHAR(255),
ALTER COLUMN "real_name" SET DATA TYPE VARCHAR(150);
