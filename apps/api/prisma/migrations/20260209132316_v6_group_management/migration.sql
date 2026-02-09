-- AlterTable
ALTER TABLE "ChatMember" ADD COLUMN     "inviter_id" TEXT,
ADD COLUMN     "muted_until" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "announcement" VARCHAR(2000),
ADD COLUMN     "is_mute_all" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "join_need_approval" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ChatMember_conversationId_role_idx" ON "ChatMember"("conversationId", "role");
