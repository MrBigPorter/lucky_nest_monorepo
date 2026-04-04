import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';

@Injectable()
export class ArticleService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取文章列表
   */
  async getArticles() {
    return this.prisma.blogArticle.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, username: true, realName: true } },
        category: true,
        tags: true,
      },
    });
  }

  /**
   * 获取文章详情
   */
  async getArticle(id: string) {
    const article = await this.prisma.blogArticle.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true, realName: true } },
        category: true,
        tags: true,
      },
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    return article;
  }
}
