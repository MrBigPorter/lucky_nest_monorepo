-- CreateTable
CREATE TABLE "devices" (
    "fcm_token" VARCHAR(255) NOT NULL,
    "platform" VARCHAR(20) NOT NULL,
    "user_id" VARCHAR(32),
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("fcm_token")
);

-- CreateIndex
CREATE INDEX "devices_user_id_idx" ON "devices"("user_id");

-- CreateIndex
CREATE INDEX "devices_platform_idx" ON "devices"("platform");

-- CreateIndex
CREATE INDEX "devices_last_active_at_idx" ON "devices"("last_active_at");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
