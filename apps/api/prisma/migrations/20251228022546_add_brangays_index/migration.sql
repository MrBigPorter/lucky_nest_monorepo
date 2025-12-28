/*
  Warnings:

  - A unique constraint covering the columns `[city_id,barangay_name]` on the table `barangays` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "barangays_city_id_barangay_name_key" ON "barangays"("city_id", "barangay_name");
