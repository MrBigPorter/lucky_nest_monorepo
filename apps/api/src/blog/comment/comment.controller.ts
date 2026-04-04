import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Ip,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CommentStatus } from '@prisma/client';
import { AdminJwtAuthGuard } from '@api/admin/auth/admin-jwt-auth.guard';

@ApiTags('Blog - Comments')
@Controller('admin/blog/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(AdminJwtAuthGuard)
  @ApiOperation({ summary: '获取所有评论列表 (管理员)' })
  async getAllComments(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('status') status?: CommentStatus,
    @Query('articleId') articleId?: string,
  ) {
    return this.commentService.getAllComments({
      page,
      pageSize,
      status,
      articleId,
    });
  }

  @Post()
  @ApiOperation({ summary: '提交评论 (公开接口)' })
  async createComment(
    @Body()
    body: {
      articleId: string;
      nickname: string;
      email?: string;
      content: string;
      website?: string;
      parentId?: string;
    },
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.commentService.createComment(body.articleId, {
      nickname: body.nickname,
      email: body.email!,
      content: body.content,
      website: body.website,
      parentId: body.parentId,
      ip,
      userAgent,
    });
  }

  @Patch(':id/approve')
  @ApiBearerAuth()
  @UseGuards(AdminJwtAuthGuard)
  @ApiOperation({ summary: '审核通过评论' })
  async approveComment(@Param('id') id: string) {
    return this.commentService.approveComment(id);
  }

  @Patch(':id/reject')
  @ApiBearerAuth()
  @UseGuards(AdminJwtAuthGuard)
  @ApiOperation({ summary: '审核拒绝评论' })
  async rejectComment(@Param('id') id: string) {
    return this.commentService.rejectComment(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AdminJwtAuthGuard)
  @ApiOperation({ summary: '删除评论' })
  async deleteComment(@Param('id') id: string) {
    return this.commentService.deleteComment(id);
  }
}
