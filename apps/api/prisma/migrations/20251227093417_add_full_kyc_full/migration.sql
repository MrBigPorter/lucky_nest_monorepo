-- AlterTable
ALTER TABLE "kyc_records" ADD COLUMN     "app_version" VARCHAR(20),
ADD COLUMN     "employer_name" VARCHAR(100),
ADD COLUMN     "issue_date" TIMESTAMP(3),
ADD COLUMN     "nationality" VARCHAR(50),
ADD COLUMN     "ocr_raw_data" JSONB,
ADD COLUMN     "place_of_birth" VARCHAR(100),
ADD COLUMN     "risk_level" SMALLINT NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "kyc_records_id_number_idx" ON "kyc_records"("id_number");
