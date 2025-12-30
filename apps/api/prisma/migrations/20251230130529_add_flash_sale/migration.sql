-- AlterTable
ALTER TABLE "treasures" ADD COLUMN     "fake_sales_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lifecycle_status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "virtual_avatars" JSONB;

-- CreateTable
CREATE TABLE "flash_sale_sessions" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(50) NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "flash_sale_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flash_sale_products" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "treasure_id" TEXT NOT NULL,
    "flash_stock" INTEGER NOT NULL DEFAULT 0,
    "flash_price" DECIMAL(10,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "flash_sale_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flash_sale_sessions_start_time_end_time_idx" ON "flash_sale_sessions"("start_time", "end_time");

-- CreateIndex
CREATE INDEX "idx_treasure_cron" ON "treasures"("lifecycle_status", "sales_end_at");

-- AddForeignKey
ALTER TABLE "flash_sale_products" ADD CONSTRAINT "flash_sale_products_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "flash_sale_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flash_sale_products" ADD CONSTRAINT "flash_sale_products_treasure_id_fkey" FOREIGN KEY ("treasure_id") REFERENCES "treasures"("treasure_id") ON DELETE RESTRICT ON UPDATE CASCADE;
