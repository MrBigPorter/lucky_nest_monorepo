import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ArticleService } from './article.service';

@ApiTags('Blog - Articles')
@Controller('admin/blog/articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @ApiOperation({ summary: '获取文章列表 (公开)' })
  async getArticles() {
    return this.articleService.getArticles();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取文章详情 (公开)' })
  async getArticle(@Param('id') id: string) {
    return this.articleService.getArticle(id);
  }
}
