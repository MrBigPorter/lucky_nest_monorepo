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
