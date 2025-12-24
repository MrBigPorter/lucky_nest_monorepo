-- CreateTable
CREATE TABLE "kyc_liveness_sessions" (
    "id" VARCHAR(32) NOT NULL,
    "userId" VARCHAR(32) NOT NULL,
    "session_id" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_liveness_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kyc_liveness_sessions_session_id_key" ON "kyc_liveness_sessions"("session_id");

-- CreateIndex
CREATE INDEX "kyc_liveness_sessions_userId_createdAt_idx" ON "kyc_liveness_sessions"("userId", "createdAt");
