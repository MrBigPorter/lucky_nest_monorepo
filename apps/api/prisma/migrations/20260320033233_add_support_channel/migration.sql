-- CreateTable
CREATE TABLE "support_channels" (
    "id" VARCHAR(64) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "botUserId" VARCHAR(32) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_channels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "support_channels_botUserId_key" ON "support_channels"("botUserId");

-- CreateIndex
CREATE INDEX "idx_support_channel_is_active" ON "support_channels"("isActive");

-- AddForeignKey
ALTER TABLE "support_channels" ADD CONSTRAINT "support_channels_botUserId_fkey" FOREIGN KEY ("botUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
