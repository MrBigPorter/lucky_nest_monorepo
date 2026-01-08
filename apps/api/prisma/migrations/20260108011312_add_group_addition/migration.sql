-- AlterTable
ALTER TABLE "treasure_group_members" ADD COLUMN     "member_type" SMALLINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "treasure_groups" ADD COLUMN     "ended_at" TIMESTAMP(3),
ADD COLUMN     "is_system_filled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "idx_expire_at" ON "treasure_groups"("expire_at");
