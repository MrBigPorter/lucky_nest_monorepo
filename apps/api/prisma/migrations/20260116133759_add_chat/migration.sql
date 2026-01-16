-- AlterEnum
ALTER TYPE "ConversationType" ADD VALUE 'BUSINESS';

-- AlterTable
ALTER TABLE "ChatMember" ADD COLUMN     "isMuted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "lastMsgSenderId" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 1;
