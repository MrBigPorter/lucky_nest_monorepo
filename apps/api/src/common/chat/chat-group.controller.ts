import {
  Body,
  Controller,
  Post,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { ChatGroupService } from '@api/common/chat/chat-group.service';
import {
  KickMemberDto,
  KickMemberResDto,
  MuteMemberDto,
  MuteMemberResDto,
  TransferOwnerDto,
  UpdateGroupInfoDto,
  UpdateGroupResDto,
  SetAdminDto, // [New]
} from '@api/common/chat/dto/group/group-manage.dto';
import { CurrentUserId } from '@api/common/decorators/user.decorator';

@ApiTags('Chat Group Management (v6.0)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat/group')
export class ChatGroupController {
  constructor(private readonly groupService: ChatGroupService) {}

  @Post('kick')
  @ApiOperation({ summary: 'Kick a member from the group (Admins/Owner only)' })
  @ApiResponse({ status: 200, type: KickMemberResDto })
  async kickMember(
    @CurrentUserId() userId: string,
    @Body() dto: KickMemberDto,
  ): Promise<KickMemberResDto> {
    return this.groupService.kickMember(userId, dto);
  }

  @Post('mute')
  @ApiOperation({ summary: 'Mute/Unmute a member (Admins/Owner only)' })
  @ApiResponse({ status: 200, type: MuteMemberResDto })
  async muteMember(
    @CurrentUserId() userId: string,
    @Body() dto: MuteMemberDto,
  ): Promise<MuteMemberResDto> {
    return this.groupService.muteMember(userId, dto);
  }

  @Post('update')
  @ApiOperation({ summary: 'Update group info/settings (Admins/Owner only)' })
  @ApiResponse({ status: 200, type: UpdateGroupResDto })
  async updateGroup(
    @CurrentUserId() userId: string,
    @Body() dto: UpdateGroupInfoDto,
  ): Promise<UpdateGroupResDto> {
    return this.groupService.updateGroupInfo(userId, dto);
  }

  @Post('transfer-owner')
  @ApiOperation({ summary: 'Transfer group ownership (Owner only)' })
  async transferOwner(
    @CurrentUserId() userId: string,
    @Body() dto: TransferOwnerDto,
  ) {
    return this.groupService.transferOwner(userId, dto);
  }

  @Post('admin')
  @ApiOperation({ summary: 'Promote/Demote an admin (Owner only)' })
  async setAdmin(@CurrentUserId() userId: string, @Body() dto: SetAdminDto) {
    return this.groupService.setAdmin(userId, dto);
  }

  @Delete('leave/:conversationId')
  @ApiOperation({ summary: 'Leave a group (Member/Admin only)' })
  async leaveGroup(
    @CurrentUserId() userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.groupService.leaveGroup(userId, conversationId);
  }

  @Delete('disband/:conversationId')
  @ApiOperation({ summary: 'Disband a group (Owner only)' })
  async disbandGroup(
    @CurrentUserId() userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.groupService.disbandGroup(userId, conversationId);
  }
}
