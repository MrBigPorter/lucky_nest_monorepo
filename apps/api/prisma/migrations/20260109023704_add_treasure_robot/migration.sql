-- AlterTable
ALTER TABLE "treasures" ADD COLUMN     "leader_bonus_type" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "robot_delay" INTEGER NOT NULL DEFAULT 300;
