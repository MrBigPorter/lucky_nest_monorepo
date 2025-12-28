/*
  Warnings:

  - The primary key for the `kyc_id_types` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `requires_back` on the `kyc_id_types` table. All the data in the column will be lost.
  - You are about to drop the column `requires_front` on the `kyc_id_types` table. All the data in the column will be lost.
  - You are about to drop the column `requires_ocr` on the `kyc_id_types` table. All the data in the column will be lost.
  - You are about to drop the column `type_id` on the `kyc_id_types` table. All the data in the column will be lost.
  - You are about to drop the column `type_name` on the `kyc_id_types` table. All the data in the column will be lost.
  - You are about to drop the column `type_name_en` on the `kyc_id_types` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `kyc_id_types` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `kyc_id_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `kyc_id_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `label` to the `kyc_id_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `kyc_id_types` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."kyc_records_id_number_idx";

-- AlterTable
ALTER TABLE "kyc_id_types" DROP CONSTRAINT "kyc_id_types_pkey",
DROP COLUMN "requires_back",
DROP COLUMN "requires_front",
DROP COLUMN "requires_ocr",
DROP COLUMN "type_id",
DROP COLUMN "type_name",
DROP COLUMN "type_name_en",
ADD COLUMN     "code" VARCHAR(50) NOT NULL,
ADD COLUMN     "country" VARCHAR(10) NOT NULL DEFAULT 'GLOBAL',
ADD COLUMN     "id" INTEGER NOT NULL,
ADD COLUMN     "label" VARCHAR(100) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "kyc_id_types_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_id_types_code_key" ON "kyc_id_types"("code");

-- CreateIndex
CREATE INDEX "kyc_records_country_code_id_type_id_number_idx" ON "kyc_records"("country_code", "id_type", "id_number");
