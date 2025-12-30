-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "has_bonus" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "logistics_co" VARCHAR(50),
ADD COLUMN     "shipping_address" JSONB,
ADD COLUMN     "shipping_status" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "tracking_no" VARCHAR(50);

-- AlterTable
ALTER TABLE "treasure_groups" ADD COLUMN     "drawn_at" TIMESTAMP(3),
ADD COLUMN     "expire_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "robot_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "success_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "treasures" ADD COLUMN     "bonus_config" JSONB,
ADD COLUMN     "group_size" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "group_time_limit" INTEGER NOT NULL DEFAULT 86400,
ADD COLUMN     "sales_end_at" TIMESTAMP(3),
ADD COLUMN     "sales_start_at" TIMESTAMP(3),
ADD COLUMN     "shipping_type" SMALLINT NOT NULL DEFAULT 1,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weight" DECIMAL(10,3);
