-- CreateTable
CREATE TABLE "friend_requests" (
    "request_id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "from_user_id" VARCHAR(32) NOT NULL,
    "to_user_id" VARCHAR(32) NOT NULL,
    "reason" VARCHAR(200),
    "status" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "friend_requests_pkey" PRIMARY KEY ("request_id")
);

-- CreateIndex
CREATE INDEX "friend_requests_to_user_id_status_idx" ON "friend_requests"("to_user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "friend_requests_from_user_id_to_user_id_key" ON "friend_requests"("from_user_id", "to_user_id");

-- AddForeignKey
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
