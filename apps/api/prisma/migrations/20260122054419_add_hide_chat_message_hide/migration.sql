-- CreateTable
CREATE TABLE "ChatMessageHide" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessageHide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatMessageHide_userId_idx" ON "ChatMessageHide"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessageHide_userId_messageId_key" ON "ChatMessageHide"("userId", "messageId");

-- AddForeignKey
ALTER TABLE "ChatMessageHide" ADD CONSTRAINT "ChatMessageHide_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
