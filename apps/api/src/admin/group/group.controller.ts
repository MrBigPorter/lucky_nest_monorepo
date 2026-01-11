import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GroupCreateDto } from '@api/common/group/dto/group-create.dto';
import { GroupService } from '@api/common/group/group.service';
import { GroupListForTreasureDto } from '@api/common/group/dto/group-list-for-treasure.dto';
import { ApiOkResponse } from '@nestjs/swagger';
import { GroupListForTreasureResponseDto } from '@api/common/group/dto/group-list-for-treasure-response.dto';
import { GroupMembersDto } from '@api/common/group/dto/group-members.dto';
import { GroupMembersResponseDto } from '@api/common/group/dto/group-members-response.dto';
import { plainToInstance } from 'class-transformer';
import { GroupForTreasureItemDto } from '@api/common/group/dto/group-for-treasure-item.dto';
import { GroupDetailResponseDto } from '@api/common/group/dto/group-detail.response.dto';

@Controller('admin/groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get('list')
  @ApiOkResponse({ type: GroupListForTreasureResponseDto })
  async list(@Query() query: GroupListForTreasureDto) {
    const data = await this.groupService.listGroupForTreasure(null, query);
    return {
      ...data,
      list: plainToInstance(GroupForTreasureItemDto, data.list),
    };
  }

  @Get(':groupId/members')
  @ApiOkResponse({ type: GroupMembersResponseDto })
  async get(
    @Param('groupId') groupId: string,
    @Query() query: GroupMembersDto,
  ) {
    const data = await this.groupService.listGroupMembers(groupId, query);
    return plainToInstance(GroupMembersResponseDto, data);
  }

  @Get(':groupId')
  @ApiOkResponse({ type: GroupDetailResponseDto })
  async getGroupDetail(@Param('groupId') groupId: string) {
    const data = await this.groupService.getGroupDetail(groupId);
    return plainToInstance(GroupDetailResponseDto, data);
  }
}
