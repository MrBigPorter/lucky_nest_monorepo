-- CreateTable
CREATE TABLE "kyc_liveness_attempts" (
    "id" VARCHAR(32) NOT NULL,
    "user_id" VARCHAR(32) NOT NULL,
    "attempt_id" VARCHAR(64) NOT NULL,
    "token" VARCHAR(128) NOT NULL,
    "session_id" VARCHAR(64),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_liveness_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kyc_liveness_attempts_user_id_key" ON "kyc_liveness_attempts"("user_id");

-- CreateIndex
CREATE INDEX "kyc_liveness_attempts_expires_at_idx" ON "kyc_liveness_attempts"("expires_at");

-- AddForeignKey
ALTER TABLE "kyc_liveness_attempts" ADD CONSTRAINT "kyc_liveness_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
