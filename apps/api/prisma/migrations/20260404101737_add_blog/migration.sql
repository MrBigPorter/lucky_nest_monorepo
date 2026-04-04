-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "blog_articles" (
    "id" VARCHAR(32) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "coverImage" VARCHAR(255),
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "meta" JSONB,
    "authorId" VARCHAR(32) NOT NULL,
    "categoryId" VARCHAR(32),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_categories" (
    "id" VARCHAR(32) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "parentId" VARCHAR(32),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_tags" (
    "id" VARCHAR(32) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_comments" (
    "id" VARCHAR(32) NOT NULL,
    "articleId" VARCHAR(32) NOT NULL,
    "author" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "website" VARCHAR(255),
    "content" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'PENDING',
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "parentId" VARCHAR(32),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BlogArticleTags" (
    "A" VARCHAR(32) NOT NULL,
    "B" VARCHAR(32) NOT NULL,

    CONSTRAINT "_BlogArticleTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "blog_articles_slug_key" ON "blog_articles"("slug");

-- CreateIndex
CREATE INDEX "idx_blog_article_slug" ON "blog_articles"("slug");

-- CreateIndex
CREATE INDEX "idx_blog_article_status" ON "blog_articles"("status");

-- CreateIndex
CREATE INDEX "idx_blog_article_created_at" ON "blog_articles"("created_at");

-- CreateIndex
CREATE INDEX "idx_blog_article_author_id" ON "blog_articles"("authorId");

-- CreateIndex
CREATE INDEX "idx_blog_article_category_id" ON "blog_articles"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_slug_key" ON "blog_categories"("slug");

-- CreateIndex
CREATE INDEX "idx_blog_category_slug" ON "blog_categories"("slug");

-- CreateIndex
CREATE INDEX "idx_blog_category_parent_id" ON "blog_categories"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_tags_slug_key" ON "blog_tags"("slug");

-- CreateIndex
CREATE INDEX "idx_blog_tag_slug" ON "blog_tags"("slug");

-- CreateIndex
CREATE INDEX "idx_blog_comment_article_id" ON "blog_comments"("articleId");

-- CreateIndex
CREATE INDEX "idx_blog_comment_status" ON "blog_comments"("status");

-- CreateIndex
CREATE INDEX "idx_blog_comment_created_at" ON "blog_comments"("created_at");

-- CreateIndex
CREATE INDEX "idx_blog_comment_parent_id" ON "blog_comments"("parentId");

-- CreateIndex
CREATE INDEX "_BlogArticleTags_B_index" ON "_BlogArticleTags"("B");

-- AddForeignKey
ALTER TABLE "blog_articles" ADD CONSTRAINT "blog_articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "admin_users"("admin_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_articles" ADD CONSTRAINT "blog_articles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "blog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_categories" ADD CONSTRAINT "blog_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "blog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "blog_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "blog_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogArticleTags" ADD CONSTRAINT "_BlogArticleTags_A_fkey" FOREIGN KEY ("A") REFERENCES "blog_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogArticleTags" ADD CONSTRAINT "_BlogArticleTags_B_fkey" FOREIGN KEY ("B") REFERENCES "blog_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
