-- AlterTable
ALTER TABLE "treasures" ADD COLUMN     "enable_robot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "market_amount" DECIMAL(10,2),
ADD COLUMN     "solo_amount" DECIMAL(10,2);
