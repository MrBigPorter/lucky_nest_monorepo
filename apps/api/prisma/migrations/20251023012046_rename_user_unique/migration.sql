/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `OtpRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "OtpRequest_phone_key" ON "OtpRequest"("phone");
