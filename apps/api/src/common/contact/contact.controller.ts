import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { ContactService } from '@api/common/contact/contact.service';
import { HandleContactDto } from '@api/common/contact/dto/handle-contact.dto';
import { CurrentUserId } from '@api/common/decorators/user.decorator';
import { AddFriendDto } from '@api/common/contact/dto/contact.dto';
import {
  AddFriendResponseDto,
  ContactItemDto,
  FriendRequestItemDto,
  HandleContactResponseDto,
  SearchUserResponseDto,
} from '@api/common/contact/dto/contact-response.dto';
import { SearchUserDto } from '@api/common/contact/dto/search-user.dto';

@ApiTags('Chat - Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat/contacts')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  /**
   * Add a friend (send a friend request)
   * @param userId
   * @param dto
   */
  @Post('add')
  @ApiOperation({ summary: 'Send a friend request' })
  @ApiResponse({ type: AddFriendResponseDto })
  @HttpCode(HttpStatus.OK)
  async addFriend(@CurrentUserId() userId: string, @Body() dto: AddFriendDto) {
    return this.contactService.addFriend(userId, dto);
  }

  /**
   * Get pending friend requests (people who added me)
   * @param userId
   */

  @Get('requests')
  @ApiOperation({ summary: 'Get pending requests (People adding me)' })
  @ApiResponse({ type: [FriendRequestItemDto] })
  async getFriendRequests(@CurrentUserId() userId: string) {
    return this.contactService.getFriendRequests(userId);
  }

  /**
   * Accept or Reject a friend request
   * @param userId
   * @param dto
   */
  @Post('handle')
  @ApiOperation({ summary: 'Accept or Reject a request' })
  @ApiResponse({ type: HandleContactResponseDto })
  @HttpCode(HttpStatus.OK)
  async handleRequest(
    @CurrentUserId() userId: string,
    @Body() dto: HandleContactDto,
  ) {
    return this.contactService.handleFriendRequest(userId, dto);
  }

  /**
   * Get my friend list
   * @param userId
   */
  @Get('list')
  @ApiOperation({ summary: 'Get my friend list' })
  @ApiResponse({ type: [ContactItemDto] })
  async getContacts(@CurrentUserId() userId: string) {
    return this.contactService.getContacts(userId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users by keyword' })
  @ApiResponse({ type: [SearchUserResponseDto] })
  async searchUsers(
    @CurrentUserId() userId: string,
    @Query() dto: SearchUserDto,
  ) {
    return this.contactService.searchUsers(userId, dto);
  }
}
