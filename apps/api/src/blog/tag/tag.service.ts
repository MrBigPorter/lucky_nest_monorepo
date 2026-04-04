import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@api/common/prisma/prisma.service';

@Injectable()
export class TagService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建标签
   */
  async createTag(data: { name: string; slug?: string }) {
    let slug = data.slug;
    if (!slug) {
      slug = data.name.toLowerCase().replace(/[^\w\s\u4e00-\u9fa5]/g, '');
    }

    return this.prisma.blogTag.create({
      data: {
        name: data.name,
        slug,
      },
    });
  }

  /**
   * 获取标签列表
   */
  async getTags(includeCount = true, sortBy = 'articles') {
    const orderBy =
      sortBy === 'articles'
        ? { articles: { _count: 'desc' as const } }
        : { name: 'asc' as const };

    return this.prisma.blogTag.findMany({
      orderBy,
      include: includeCount
        ? {
            _count: {
              select: { articles: true },
            },
          }
        : undefined,
    });
  }

  /**
   * 获取热门标签
   */
  async getPopularTags(limit = 20) {
    return this.prisma.blogTag.findMany({
      take: limit,
      orderBy: {
        articles: { _count: 'desc' },
      },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });
  }

  /**
   * 获取标签详情
   */
  async getTag(id: string) {
    const tag = await this.prisma.blogTag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException('标签不存在');
    }

    return tag;
  }

  /**
   * 更新标签
   */
  async updateTag(
    id: string,
    data: {
      name?: string;
      slug?: string;
      color?: string;
      description?: string;
    },
  ) {
    return this.prisma.blogTag.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除标签
   */
  async deleteTag(id: string) {
    // 自动解除所有文章关联
    const articles = await this.prisma.blogArticle.findMany({
      where: { tags: { some: { id } } },
      select: { id: true },
    });

    // 对每个文章执行单独的更新操作以解除标签关联
    for (const article of articles) {
      await this.prisma.blogArticle.update({
        where: { id: article.id },
        data: {
          tags: {
            disconnect: { id },
          },
        },
      });
    }

    return this.prisma.blogTag.delete({
      where: { id },
    });
  }
}
