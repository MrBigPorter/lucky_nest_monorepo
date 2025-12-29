/*
  Warnings:

  - You are about to drop the column `hotScore3d` on the `treasures` table. All the data in the column will be lost.
  - You are about to drop the column `hotScore7d` on the `treasures` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "treasures" DROP COLUMN "hotScore3d",
DROP COLUMN "hotScore7d",
ADD COLUMN     "hot_score_3d" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "hot_score_7d" DOUBLE PRECISION NOT NULL DEFAULT 0;
