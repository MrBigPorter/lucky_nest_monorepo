/*
  Warnings:

  - Added the required column `contact_name` to the `user_addresses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_addresses" ADD COLUMN     "contact_name" VARCHAR(100) NOT NULL,
ALTER COLUMN "first_name" DROP NOT NULL,
ALTER COLUMN "last_name" DROP NOT NULL;
