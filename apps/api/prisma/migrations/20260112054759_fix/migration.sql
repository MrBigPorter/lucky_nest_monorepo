-- AlterTable
ALTER TABLE "treasure_groups" ADD COLUMN     "tempField" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_robot" BOOLEAN NOT NULL DEFAULT false;
