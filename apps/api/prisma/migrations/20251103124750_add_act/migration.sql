-- CreateTable
CREATE TABLE "act_sections" (
    "id" VARCHAR(32) NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "title" VARCHAR(128) NOT NULL,
    "imgStyleType" INTEGER NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "limit" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "act_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "act_section_items" (
    "id" VARCHAR(32) NOT NULL,
    "sectionId" VARCHAR(32) NOT NULL,
    "treasureId" VARCHAR(32) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "act_section_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "act_sections_key_key" ON "act_sections"("key");

-- CreateIndex
CREATE INDEX "idx_style_status_sort" ON "act_sections"("imgStyleType", "status", "sortOrder");

-- CreateIndex
CREATE INDEX "idx_section_sort" ON "act_section_items"("sectionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "uk_section_treasure" ON "act_section_items"("sectionId", "treasureId");

-- AddForeignKey
ALTER TABLE "act_section_items" ADD CONSTRAINT "act_section_items_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "act_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
