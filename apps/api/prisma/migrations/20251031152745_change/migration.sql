-- CreateTable
CREATE TABLE "treasures" (
    "treasure_id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "treasure_seq" VARCHAR(50),
    "treasure_name" VARCHAR(200) NOT NULL,
    "product_name" VARCHAR(200),
    "treasure_cover_img" VARCHAR(255),
    "main_image_list" JSONB,
    "cost_amount" DECIMAL(10,2),
    "unit_amount" DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    "cash_amount" DECIMAL(10,2),
    "seq_shelves_quantity" INTEGER,
    "seq_buy_quantity" INTEGER NOT NULL DEFAULT 0,
    "min_buy_quantity" INTEGER,
    "max_per_buy_quantity" INTEGER,
    "buy_quantity_rate" DECIMAL(5,2),
    "lottery_mode" SMALLINT,
    "lottery_time" TIMESTAMP(3),
    "lottery_delay_time" TIMESTAMP(3),
    "lottery_delay_state" SMALLINT NOT NULL DEFAULT 0,
    "img_style_type" SMALLINT NOT NULL DEFAULT 0,
    "virtual" SMALLINT NOT NULL DEFAULT 2,
    "group_max_num" INTEGER NOT NULL DEFAULT 9999,
    "max_unit_coins" DECIMAL(10,4),
    "max_unit_amount" DECIMAL(10,2),
    "charity_amount" DECIMAL(10,2),
    "cash_state" SMALLINT,
    "rule_content" TEXT,
    "desc" TEXT,
    "state" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "treasures_pkey" PRIMARY KEY ("treasure_id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "products_category_id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "icon" VARCHAR(255),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "state" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("products_category_id")
);

-- CreateTable
CREATE TABLE "treasure_categories" (
    "id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "treasure_id" VARCHAR(32) NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "treasure_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treasure_groups" (
    "group_id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "treasure_id" VARCHAR(32) NOT NULL,
    "creator_id" VARCHAR(32) NOT NULL,
    "group_name" VARCHAR(100),
    "max_members" INTEGER NOT NULL DEFAULT 9999,
    "current_members" INTEGER NOT NULL DEFAULT 1,
    "lucky_winners_count" INTEGER NOT NULL DEFAULT 0,
    "total_winning_times" INTEGER NOT NULL DEFAULT 0,
    "group_status" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "treasure_groups_pkey" PRIMARY KEY ("group_id")
);

-- CreateTable
CREATE TABLE "treasure_group_members" (
    "id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "group_id" VARCHAR(32) NOT NULL,
    "user_id" VARCHAR(32) NOT NULL,
    "order_id" VARCHAR(32),
    "is_owner" SMALLINT NOT NULL DEFAULT 0,
    "share_coin" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "share_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "joined_at" TIMESTAMP(3),

    CONSTRAINT "treasure_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "treasures_treasure_seq_key" ON "treasures"("treasure_seq");

-- CreateIndex
CREATE INDEX "treasures_lottery_mode_idx" ON "treasures"("lottery_mode");

-- CreateIndex
CREATE INDEX "treasures_lottery_time_idx" ON "treasures"("lottery_time");

-- CreateIndex
CREATE INDEX "treasures_state_idx" ON "treasures"("state");

-- CreateIndex
CREATE INDEX "treasures_buy_quantity_rate_idx" ON "treasures"("buy_quantity_rate");

-- CreateIndex
CREATE INDEX "idx_state" ON "product_categories"("state");

-- CreateIndex
CREATE INDEX "idx_sort" ON "product_categories"("sort_order");

-- CreateIndex
CREATE INDEX "idx_treasure_id" ON "treasure_categories"("treasure_id");

-- CreateIndex
CREATE INDEX "idx_category_id" ON "treasure_categories"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "uk_treasure_category" ON "treasure_categories"("treasure_id", "category_id");

-- CreateIndex
CREATE INDEX "idx_treasure" ON "treasure_groups"("treasure_id");

-- CreateIndex
CREATE INDEX "idx_creator" ON "treasure_groups"("creator_id");

-- CreateIndex
CREATE INDEX "idx_status" ON "treasure_groups"("group_status");

-- CreateIndex
CREATE INDEX "idx_group" ON "treasure_group_members"("group_id");

-- CreateIndex
CREATE INDEX "idx_user" ON "treasure_group_members"("user_id");

-- CreateIndex
CREATE INDEX "idx_order" ON "treasure_group_members"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "uk_group_user" ON "treasure_group_members"("group_id", "user_id");

-- AddForeignKey
ALTER TABLE "treasure_categories" ADD CONSTRAINT "treasure_categories_treasure_id_fkey" FOREIGN KEY ("treasure_id") REFERENCES "treasures"("treasure_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treasure_categories" ADD CONSTRAINT "treasure_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("products_category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treasure_groups" ADD CONSTRAINT "treasure_groups_treasure_id_fkey" FOREIGN KEY ("treasure_id") REFERENCES "treasures"("treasure_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treasure_groups" ADD CONSTRAINT "treasure_groups_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treasure_group_members" ADD CONSTRAINT "treasure_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "treasure_groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treasure_group_members" ADD CONSTRAINT "treasure_group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
