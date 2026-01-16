import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from '@api/common/chat/chat.service';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUserId } from '@api/common/decorators/user.decorator';
import { CreateDirectChatDto } from '@api/common/chat/dto/create-direct-chat.dto';
import { CreateGroupChatDto } from '@api/common/chat/dto/create-group-chat.dto';
import { JoinBusinessChatDto } from '@api/common/chat/dto/join-business-chat.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * 获取会话列表
   * @param page
   * @param userId
   */
  @Get('/list')
  async getConversationList(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @CurrentUserId() userId: string,
  ) {
    return this.chatService.getConversationList(userId, page);
  }

  /**
   * 确保存在与某个业务实体的会话（如商家客服），不存在则创建
   * @param query
   */
  @Get('business')
  async getBusinessChat(@Query() query: JoinBusinessChatDto) {
    const conv = await this.chatService.ensureBusinessConversation(
      query.businessId,
    );
    return { conversationId: conv.id };
  }

  /**
   * 确保存在与某个用户的私聊会话，不存在则创建
   * @param dto
   * @param userId 当前用户 ID
   */
  @Post('direct')
  async getDirectChat(
    @Body() dto: CreateDirectChatDto,
    @CurrentUserId() userId: string,
  ) {
    const conv = await this.chatService.ensureDirectConversation(
      userId,
      dto.targetUserId,
    );
    return { conversationId: conv.id };
  }

  /**
   * 创建群聊会话
   * @param userId 当前用户 ID
   * @param dto
   */
  @Post('group')
  async createGroup(
    @CurrentUserId() userId: string,
    @Body() dto: CreateGroupChatDto,
  ) {
    const conv = await this.chatService.createGroupChat(
      userId,
      dto.name,
      dto.members,
    );
    return { conversationId: conv.id };
  }

  /**
   * 获取会话详情
   * @param id
   * @param userId
   */
  @Get('detail/:id')
  async getDetail(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.chatService.getConversationDetail(id, userId);
  }
}
