/*
  Warnings:

  - You are about to drop the column `ad_img_url` on the `advertisements` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "advertisements" DROP COLUMN "ad_img_url",
ADD COLUMN     "img" VARCHAR(255);
