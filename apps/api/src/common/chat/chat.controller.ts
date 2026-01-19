import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from '@api/common/chat/chat.service';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CurrentUserId } from '@api/common/decorators/user.decorator';
import { CreateDirectChatDto } from '@api/common/chat/dto/create-direct-chat.dto';
import { CreateGroupChatDto } from '@api/common/chat/dto/create-group-chat.dto';
import { JoinBusinessChatDto } from '@api/common/chat/dto/join-business-chat.dto';
import { SearchUserDto } from '@api/common/chat/dto/search-user.dto';
import { plainToInstance } from 'class-transformer';
import { UserSimpleResponseDto } from '@api/common/chat/dto/user-simple.response.dto';
import { GetMessagesDto } from '@api/common/chat/dto/get-messages.dto';
import { ConversationDetailResponseDto } from '@api/common/chat/dto/conversation.response.dto';
import {
  MessageListResponseDto,
  MessageResponseDto,
} from '@api/common/chat/dto/message.response.dto';
import { CreateMessageDto } from '@api/common/chat/dto/create-message.dto';
import { MarkAsReadDto } from '@api/common/chat/dto/mark-as-read.dto';
import { MarkAsReadResponseDto } from '@api/common/chat/dto/mark-as-read.response.dto';

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
   *获取历史消息 (History)
   * @param query
   * @param userId
   */
  @Get('messages')
  @ApiResponse({ type: MessageListResponseDto })
  async getChatHistory(
    @Query() query: GetMessagesDto,
    @CurrentUserId() userId: string,
  ) {
    return this.chatService.getMessages(userId, query);
  }

  @Post('message')
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ type: MessageResponseDto })
  async sendMessage(
    @CurrentUserId() userId: string,
    @Body() dto: CreateMessageDto,
  ) {
    // 调用 Service 处理业务
    const msg = await this.chatService.sendMessage(userId, dto);

    // 格式化返回结果
    return plainToInstance(MessageResponseDto, msg);
  }

  /**
   * 标记消息为已读
   * @param userId
   * @param dto
   */
  @Post('message/mark-as-read')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ type: MarkAsReadResponseDto })
  async markAsRead(
    @CurrentUserId() userId: string,
    @Body() dto: MarkAsReadDto,
  ) {
    return this.chatService.markAsRead(userId, dto);
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
  @HttpCode(HttpStatus.OK)
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
  @HttpCode(HttpStatus.OK)
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
  @ApiResponse({ type: ConversationDetailResponseDto })
  async getDetail(@Param('id') id: string, @CurrentUserId() userId: string) {
    const data = this.chatService.getConversationDetail(id, userId);
    return plainToInstance(ConversationDetailResponseDto, data);
  }

  /**
   * 搜索用户
   * @param dto
   * @param userId
   */
  @Get('users/search')
  @ApiResponse({ type: [UserSimpleResponseDto] })
  async searchUsers(
    @Query() dto: SearchUserDto,
    @CurrentUserId() userId: string,
  ) {
    const data = await this.chatService.searchUsers(userId, dto);
    return plainToInstance(UserSimpleResponseDto, data);
  }
}
