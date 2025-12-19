/*
  Warnings:

  - A unique constraint covering the columns `[province_name]` on the table `provinces` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "provinces_province_name_key" ON "provinces"("province_name");
