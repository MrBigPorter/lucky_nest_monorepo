-- DropIndex
DROP INDEX "public"."idx_group_owner_joined";

-- DropIndex
DROP INDEX "public"."idx_treasure_status_updated";

-- AlterTable
ALTER TABLE "treasure_group_members" ALTER COLUMN "share_coin" SET DATA TYPE DECIMAL(18,2),
ALTER COLUMN "share_amount" SET DATA TYPE DECIMAL(18,2);
