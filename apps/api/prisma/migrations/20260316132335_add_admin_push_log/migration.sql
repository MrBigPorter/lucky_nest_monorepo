-- CreateTable
CREATE TABLE "admin_push_logs" (
    "push_log_id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "admin_id" VARCHAR(32) NOT NULL,
    "admin_name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "target_user_id" VARCHAR(32),
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "extra_data" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'sent',
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "admin_push_logs_pkey" PRIMARY KEY ("push_log_id")
);

-- CreateIndex
CREATE INDEX "admin_push_logs_admin_id_idx" ON "admin_push_logs"("admin_id");

-- CreateIndex
CREATE INDEX "admin_push_logs_type_idx" ON "admin_push_logs"("type");

-- CreateIndex
CREATE INDEX "admin_push_logs_created_at_idx" ON "admin_push_logs"("created_at");

-- AddForeignKey
ALTER TABLE "admin_push_logs" ADD CONSTRAINT "admin_push_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("admin_id") ON DELETE RESTRICT ON UPDATE CASCADE;
