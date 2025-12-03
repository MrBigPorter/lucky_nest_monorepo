-- CreateTable
CREATE TABLE "admin_users" (
    "admin_id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "real_name" VARCHAR(100),
    "role" VARCHAR(50) NOT NULL DEFAULT 'viewer',
    "status" SMALLINT NOT NULL DEFAULT 1,
    "last_login_at" TIMESTAMP(3),
    "last_login_ip" VARCHAR(50),

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("admin_id")
);

-- CreateTable
CREATE TABLE "admin_operation_logs" (
    "log_id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "admin_id" VARCHAR(32) NOT NULL,
    "admin_name" VARCHAR(100) NOT NULL,
    "module" VARCHAR(100) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "details" TEXT,
    "request_ip" VARCHAR(50),

    CONSTRAINT "admin_operation_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");

-- CreateIndex
CREATE INDEX "idx_admin_status" ON "admin_users"("status");

-- CreateIndex
CREATE INDEX "admin_operation_logs_admin_id_idx" ON "admin_operation_logs"("admin_id");

-- CreateIndex
CREATE INDEX "admin_operation_logs_module_action_idx" ON "admin_operation_logs"("module", "action");

-- CreateIndex
CREATE INDEX "admin_operation_logs_created_at_idx" ON "admin_operation_logs"("created_at");

-- AddForeignKey
ALTER TABLE "admin_operation_logs" ADD CONSTRAINT "admin_operation_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("admin_id") ON DELETE RESTRICT ON UPDATE CASCADE;
