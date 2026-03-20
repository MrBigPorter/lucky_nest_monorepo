-- CreateTable
CREATE TABLE "admin_register_applications" (
    "app_id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "real_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "apply_reason" TEXT,
    "apply_ip" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "reviewed_by" VARCHAR(32),
    "review_note" TEXT,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "admin_register_applications_pkey" PRIMARY KEY ("app_id")
);

-- CreateIndex
CREATE INDEX "idx_app_status" ON "admin_register_applications"("status");

-- CreateIndex
CREATE INDEX "idx_app_email" ON "admin_register_applications"("email");

-- CreateIndex
CREATE INDEX "idx_app_username" ON "admin_register_applications"("username");

-- CreateIndex
CREATE INDEX "idx_app_created_at" ON "admin_register_applications"("created_at");
