import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { CurrentUserId } from '@api/common/decorators/user.decorator';
import { plainToInstance } from 'class-transformer';
import {
  ClientAddFriendDto,
  UserInfoResponseDto,
} from '@api/client/users/dto/user-relation.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /**
   * 获取用户的联系人列表
   * @param userId
   */
  @Get('contacts')
  @ApiResponse({ type: [UserInfoResponseDto] })
  getContacts(@CurrentUserId() userId: string) {
    const data = this.users.getContacts(userId);
    return plainToInstance(UserInfoResponseDto, data);
  }

  /**
   * 添加好友
   * @param userId
   * @param dto
   */
  @Post('add-friend')
  @ApiResponse({ type: UserInfoResponseDto })
  async addFriend(
    @CurrentUserId() userId: string,
    @Body() dto: ClientAddFriendDto,
  ) {
    const data = await this.users.addFriend(userId, dto.friendId);
    return data && data.length > 0;
  }
}
