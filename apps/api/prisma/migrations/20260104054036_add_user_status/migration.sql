-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" SMALLINT NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "idx_user_status" ON "users"("status");
