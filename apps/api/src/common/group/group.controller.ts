import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { GroupCreateDto } from '@api/common/group/dto/group-create.dto';
import { GroupService } from '@api/common/group/group.service';
import { CurrentUserId } from '@api/common/decorators/user.decorator';
import { GroupListForTreasureDto } from '@api/common/group/dto/group-list-for-treasure.dto';
import { ApiOkResponse } from '@nestjs/swagger';
import { GroupListForTreasureResponseDto } from '@api/common/group/dto/group-list-for-treasure-response.dto';
import { GroupMembersDto } from '@api/common/group/dto/group-members.dto';
import { GroupMembersResponseDto } from '@api/common/group/dto/group-members-response.dto';

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  // 开团：leaderUserId 不信前端，强制用登录用户
  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(@Body() dto: GroupCreateDto, @CurrentUserId() userId: string) {
    return await this.groupService.createGroup({
      ...dto,
      leaderUserId: userId,
    });
  }

  //加入团：groupId 走URL，userId 不信前端，强制用登录用户
  @UseGuards(JwtAuthGuard)
  @Post(':groupId/join')
  async join(
    @Param('groupId') groupId: string,
    @Body() body: GroupCreateDto,
    @CurrentUserId() userId: string,
  ) {
    return await this.groupService.joinGroup({
      groupId,
      userId,
      orderId: body.orderId,
    });
  }

  // 退团：groupId 走 URL，userId 用登录用户
  @UseGuards(JwtAuthGuard)
  @Post(':groupId/leave')
  async leave(
    @Param('groupId') groupId: string,
    @CurrentUserId() userId: string,
  ) {
    return await this.groupService.leaveGroup({
      groupId,
      userId,
    });
  }

  @Get('list')
  @ApiOkResponse({ type: GroupListForTreasureResponseDto })
  async list(@Query() query: GroupListForTreasureDto) {
    return await this.groupService.listGroupForTreasure(query);
  }

  @Get(':groupId/members')
  @ApiOkResponse({ type: GroupMembersResponseDto })
  async get(
    @Param('groupId') groupId: string,
    @Query() query: GroupMembersDto,
  ) {
    return await this.groupService.listGroupMembers(groupId, query);
  }
}
