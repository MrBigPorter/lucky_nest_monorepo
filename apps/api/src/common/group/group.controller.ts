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

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get('list')
  @ApiOkResponse({ type: GroupListForTreasureResponseDto })
  async list(@Query() query: GroupListForTreasureDto) {
    const data = await this.groupService.listGroupForTreasure(query);
    return plainToInstance(GroupForTreasureItemDto, data);
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
    const data = this.groupService.getGroupDetail(groupId);
    console.log('group detail data', data);
    return plainToInstance(GroupDetailResponseDto, data);
  }
}
