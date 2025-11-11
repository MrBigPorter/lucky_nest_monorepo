-- CreateTable
CREATE TABLE "banners" (
    "banner_id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "title" VARCHAR(200),
    "banner_img_url" VARCHAR(255),
    "video_url" VARCHAR(255),
    "file_type" SMALLINT NOT NULL DEFAULT 1,
    "banner_cate" SMALLINT NOT NULL,
    "position" SMALLINT NOT NULL DEFAULT 0,
    "sort_type" SMALLINT NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "jump_cate" SMALLINT,
    "jump_url" VARCHAR(500),
    "related_title_id" VARCHAR(32),
    "show_type" SMALLINT NOT NULL DEFAULT 1,
    "img_style_type" SMALLINT NOT NULL DEFAULT 0,
    "grid_id" VARCHAR(32),
    "banner_array" JSONB,
    "activity_at_start" TIMESTAMP(3),
    "activity_at_end" TIMESTAMP(3),
    "state" SMALLINT NOT NULL DEFAULT 1,
    "valid_state" SMALLINT NOT NULL DEFAULT 1,
    "created_by" VARCHAR(50),
    "updated_by" VARCHAR(50),
    "extra" JSONB,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("banner_id")
);

-- CreateTable
CREATE TABLE "advertisements" (
    "ad_id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "title" VARCHAR(200),
    "ad_img_url" VARCHAR(255),
    "video_url" VARCHAR(255),
    "file_type" SMALLINT NOT NULL DEFAULT 1,
    "ad_position" SMALLINT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "jump_cate" SMALLINT,
    "jump_url" VARCHAR(500),
    "related_id" VARCHAR(32),
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "status" SMALLINT NOT NULL DEFAULT 1,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "extra" JSONB,

    CONSTRAINT "advertisements_pkey" PRIMARY KEY ("ad_id")
);

-- CreateIndex
CREATE INDEX "idx_banner_cate" ON "banners"("banner_cate");

-- CreateIndex
CREATE INDEX "idx_position_banner" ON "banners"("position");

-- CreateIndex
CREATE INDEX "idx_state_banner" ON "banners"("state");

-- CreateIndex
CREATE INDEX "idx_sort_order_banner" ON "banners"("sort_order");

-- CreateIndex
CREATE INDEX "idx_activity_time" ON "banners"("activity_at_start", "activity_at_end");

-- CreateIndex
CREATE INDEX "idx_position_ad" ON "advertisements"("ad_position");

-- CreateIndex
CREATE INDEX "idx_status_ad" ON "advertisements"("status");

-- CreateIndex
CREATE INDEX "idx_time_ad" ON "advertisements"("start_time", "end_time");
