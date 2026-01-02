/*
  Warnings:

  - Added the required column `barangay_id` to the `user_addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city_id` to the `user_addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `province_id` to the `user_addresses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_addresses" ADD COLUMN     "barangay_id" INTEGER NOT NULL,
ADD COLUMN     "city_id" INTEGER NOT NULL,
ADD COLUMN     "province_id" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "user_addresses_province_id_idx" ON "user_addresses"("province_id");

-- CreateIndex
CREATE INDEX "user_addresses_city_id_idx" ON "user_addresses"("city_id");

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("province_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("city_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_barangay_id_fkey" FOREIGN KEY ("barangay_id") REFERENCES "barangays"("barangay_id") ON DELETE RESTRICT ON UPDATE CASCADE;
