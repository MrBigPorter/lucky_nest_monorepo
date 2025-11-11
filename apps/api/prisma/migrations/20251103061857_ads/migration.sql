-- AlterTable
ALTER TABLE "advertisements" ADD COLUMN     "banner_array" JSONB,
ADD COLUMN     "img_style_type" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "sort_type" SMALLINT NOT NULL DEFAULT 1;
