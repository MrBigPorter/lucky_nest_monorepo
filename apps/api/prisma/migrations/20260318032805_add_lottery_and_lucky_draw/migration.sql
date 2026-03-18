-- CreateTable
CREATE TABLE "lottery_results" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "group_id" VARCHAR(32) NOT NULL,
    "treasure_id" VARCHAR(32) NOT NULL,
    "winner_id" VARCHAR(32) NOT NULL,
    "winner_order_id" VARCHAR(32) NOT NULL,

    CONSTRAINT "lottery_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lucky_draw_activities" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "treasure_id" VARCHAR(32),
    "status" SMALLINT NOT NULL DEFAULT 1,
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),

    CONSTRAINT "lucky_draw_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lucky_draw_prizes" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activity_id" TEXT NOT NULL,
    "prize_type" SMALLINT NOT NULL,
    "prize_name" VARCHAR(100) NOT NULL,
    "coupon_id" VARCHAR(32),
    "prize_value" DECIMAL(10,2),
    "probability" DECIMAL(5,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT -1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lucky_draw_prizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lucky_draw_tickets" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" VARCHAR(32) NOT NULL,
    "activity_id" TEXT NOT NULL,
    "order_id" VARCHAR(32) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),
    "expire_at" TIMESTAMP(3),

    CONSTRAINT "lucky_draw_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lucky_draw_results" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticket_id" TEXT NOT NULL,
    "user_id" VARCHAR(32) NOT NULL,
    "prize_id" TEXT NOT NULL,
    "prize_snapshot" JSONB NOT NULL,

    CONSTRAINT "lucky_draw_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lottery_results_winner_id_idx" ON "lottery_results"("winner_id");

-- CreateIndex
CREATE UNIQUE INDEX "uk_lottery_group" ON "lottery_results"("group_id");

-- CreateIndex
CREATE INDEX "lucky_draw_activities_status_start_at_end_at_idx" ON "lucky_draw_activities"("status", "start_at", "end_at");

-- CreateIndex
CREATE INDEX "lucky_draw_prizes_activity_id_idx" ON "lucky_draw_prizes"("activity_id");

-- CreateIndex
CREATE INDEX "lucky_draw_tickets_user_id_used_idx" ON "lucky_draw_tickets"("user_id", "used");

-- CreateIndex
CREATE UNIQUE INDEX "uk_ticket_order_activity" ON "lucky_draw_tickets"("order_id", "activity_id");

-- CreateIndex
CREATE UNIQUE INDEX "lucky_draw_results_ticket_id_key" ON "lucky_draw_results"("ticket_id");

-- CreateIndex
CREATE INDEX "lucky_draw_results_user_id_idx" ON "lucky_draw_results"("user_id");

-- CreateIndex
CREATE INDEX "lucky_draw_results_prize_id_idx" ON "lucky_draw_results"("prize_id");

-- AddForeignKey
ALTER TABLE "lottery_results" ADD CONSTRAINT "lottery_results_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "treasure_groups"("group_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lottery_results" ADD CONSTRAINT "lottery_results_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lucky_draw_activities" ADD CONSTRAINT "lucky_draw_activities_treasure_id_fkey" FOREIGN KEY ("treasure_id") REFERENCES "treasures"("treasure_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lucky_draw_prizes" ADD CONSTRAINT "lucky_draw_prizes_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "lucky_draw_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lucky_draw_prizes" ADD CONSTRAINT "lucky_draw_prizes_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("coupon_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lucky_draw_tickets" ADD CONSTRAINT "lucky_draw_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lucky_draw_tickets" ADD CONSTRAINT "lucky_draw_tickets_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "lucky_draw_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lucky_draw_results" ADD CONSTRAINT "lucky_draw_results_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "lucky_draw_tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lucky_draw_results" ADD CONSTRAINT "lucky_draw_results_prize_id_fkey" FOREIGN KEY ("prize_id") REFERENCES "lucky_draw_prizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lucky_draw_results" ADD CONSTRAINT "lucky_draw_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
