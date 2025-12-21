-- AlterTable
ALTER TABLE "kyc_records" ADD COLUMN     "device_id" VARCHAR(100),
ADD COLUMN     "device_model" VARCHAR(100),
ADD COLUMN     "ip_address" VARCHAR(50);
