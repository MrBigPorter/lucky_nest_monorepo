-- CreateTable
CREATE TABLE "provinces" (
    "province_id" SERIAL NOT NULL,
    "province_name" VARCHAR(100) NOT NULL,
    "province_code" VARCHAR(50),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("province_id")
);

-- CreateTable
CREATE TABLE "cities" (
    "city_id" SERIAL NOT NULL,
    "province_id" INTEGER NOT NULL,
    "city_name" VARCHAR(100) NOT NULL,
    "city_code" VARCHAR(50),
    "postal_code" VARCHAR(10),
    "status" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("city_id")
);

-- CreateTable
CREATE TABLE "barangays" (
    "barangay_id" SERIAL NOT NULL,
    "city_id" INTEGER NOT NULL,
    "barangay_name" VARCHAR(100) NOT NULL,
    "status" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "barangays_pkey" PRIMARY KEY ("barangay_id")
);

-- CreateTable
CREATE TABLE "kyc_id_types" (
    "type_id" SERIAL NOT NULL,
    "type_name" VARCHAR(200) NOT NULL,
    "type_name_en" VARCHAR(200),
    "requires_front" SMALLINT NOT NULL DEFAULT 1,
    "requires_back" SMALLINT NOT NULL DEFAULT 1,
    "requires_ocr" SMALLINT NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_id_types_pkey" PRIMARY KEY ("type_id")
);

-- CreateTable
CREATE TABLE "kyc_occupation_types" (
    "occupation_id" SERIAL NOT NULL,
    "occupation_name" VARCHAR(200) NOT NULL,
    "occupation_category" VARCHAR(50),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_occupation_types_pkey" PRIMARY KEY ("occupation_id")
);

-- CreateTable
CREATE TABLE "kyc_records" (
    "id" VARCHAR(32) NOT NULL,
    "user_id" VARCHAR(32) NOT NULL,
    "kyc_status" SMALLINT NOT NULL DEFAULT 0,
    "id_type" INTEGER NOT NULL DEFAULT 1,
    "id_number" VARCHAR(50),
    "real_name" VARCHAR(100),
    "id_card_front" VARCHAR(255),
    "id_card_back" VARCHAR(255),
    "face_image" VARCHAR(255),
    "liveness_score" DOUBLE PRECISION,
    "video_url" VARCHAR(255),
    "ocr_raw_data" JSONB,
    "verify_result" JSONB,
    "audit_result" TEXT,
    "reject_reason" VARCHAR(255),
    "auditor_id" VARCHAR(32),
    "submitted_at" TIMESTAMP(3),
    "audited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cities_province_id_idx" ON "cities"("province_id");

-- CreateIndex
CREATE INDEX "barangays_city_id_idx" ON "barangays"("city_id");

-- CreateIndex
CREATE INDEX "kyc_occupation_types_occupation_category_idx" ON "kyc_occupation_types"("occupation_category");

-- CreateIndex
CREATE INDEX "kyc_records_user_id_idx" ON "kyc_records"("user_id");

-- CreateIndex
CREATE INDEX "kyc_records_kyc_status_idx" ON "kyc_records"("kyc_status");

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("province_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barangays" ADD CONSTRAINT "barangays_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("city_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_records" ADD CONSTRAINT "kyc_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
