-- CreateTable
CREATE TABLE "friends" (
    "id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" VARCHAR(32) NOT NULL,
    "friend_id" VARCHAR(32) NOT NULL,
    "remark" VARCHAR(100),
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "friends_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "friends_user_id_idx" ON "friends"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "friends_user_id_friend_id_key" ON "friends"("user_id", "friend_id");

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
