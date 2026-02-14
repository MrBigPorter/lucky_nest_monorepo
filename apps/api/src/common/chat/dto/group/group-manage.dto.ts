import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  MaxLength,
  IsEnum,
  Length,
} from 'class-validator';
import { ChatMemberRole, GroupJoinRequestStatus } from '@lucky/shared';
import { ToBool, ToNumber } from '@api/common/dto/transforms';

// ==========================================
//  REQUEST DTOs (Requests from Client)
// ==========================================

// 1. Kick Member Request
export class KickMemberDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @ApiProperty({ description: 'Target User ID to be kicked' })
  @IsString()
  @IsNotEmpty()
  targetUserId!: string;
}

// 2. Mute Member Request
export class MuteMemberDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @ApiProperty({ description: 'User ID to be muted' })
  @IsString()
  @IsNotEmpty()
  targetUserId!: string;

  @ApiProperty({ description: 'Mute duration in seconds. 0 = Unmute' })
  @IsNumber()
  @Min(0)
  duration!: number;
}

// 3. Transfer Ownership Request
export class TransferOwnerDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @ApiProperty({ description: 'New Owner User ID' })
  @IsString()
  @IsNotEmpty()
  newOwnerId!: string;
}

// 4. Update Group Information Request
export class UpdateGroupInfoDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @ApiProperty({ description: 'New group name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({ description: 'New group announcement', required: false })
  @IsString()
  @IsOptional()
  announcement?: string;

  @ApiProperty({
    description: 'Enable/Disable mute all for the group',
    required: false,
  })
  @ToBool()
  @IsBoolean()
  @IsOptional()
  isMuteAll?: boolean;

  @ApiProperty({ description: 'Require approval to join', required: false })
  @ToBool()
  @IsBoolean()
  @IsOptional()
  joinNeedApproval?: boolean;
}

// 5. Set Administrator Request
export class SetAdminDto {
  @ApiProperty({ description: 'Conversation ID' })
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @ApiProperty({ description: 'Target User ID' })
  @IsString()
  @IsNotEmpty()
  targetUserId!: string;

  @ApiProperty({
    description: 'true = Promote to Admin, false = Demote to Member',
  })
  @ToBool()
  @IsBoolean()
  isAdmin!: boolean;
}

// ==========================================
//  RESPONSE DTOs (Results from Server)
// ==========================================

// 1. Mute Member Response
export class MuteMemberResDto {
  @ApiProperty({
    description: 'Mute expiration timestamp in milliseconds. null if unmuted',
  })
  mutedUntil!: number | null;

  @ApiProperty({ description: 'Indicates if the operation was successful' })
  success!: boolean;
}

// 2. Kick Member Response
export class KickMemberResDto {
  @ApiProperty({ description: 'ID of the kicked user' })
  kickedUserId!: string;

  @ApiProperty({ description: 'Indicates if the operation was successful' })
  success!: boolean;
}

// 3. Update Group Info Response
export class UpdateGroupResDto {
  @ApiProperty({ description: 'Conversation ID' })
  id!: string;

  @ApiProperty({ description: 'Updated group name' })
  name!: string;

  @ApiProperty({ description: 'Updated group announcement' })
  announcement?: string;

  @ApiProperty({ description: 'Current "Mute All" status' })
  isMuteAll!: boolean;
}

// 4. Set Admin Response [NEW]
export class SetAdminResDto {
  @ApiProperty({ description: 'Indicates if the operation was successful' })
  success!: boolean;

  @ApiProperty({
    description: 'The new role of the target user',
    enum: ChatMemberRole,
  })
  role!: ChatMemberRole;
}

// 5. Transfer Owner Response [NEW]
export class TransferOwnerResDto {
  @ApiProperty({ description: 'Indicates if the operation was successful' })
  success!: boolean;
}

// 6. Leave Group Response [NEW]
export class LeaveGroupResDto {
  @ApiProperty({ description: 'Indicates if the operation was successful' })
  success!: boolean;
}

// 7. Disband Group Response [NEW]
export class DisbandGroupResDto {
  @ApiProperty({ description: 'Indicates if the operation was successful' })
  success!: boolean;
}

// 1. 申请入群 Request
export class ApplyToGroupDto {
  @ApiProperty({ description: 'Target Group ID' })
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @ApiProperty({ description: 'Application reason', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  reason?: string;
}

export class ApplyToGroupResDto {
  @ApiProperty({ description: 'Current status', enum: ['PENDING', 'ACCEPTED'] })
  status!: 'PENDING' | 'ACCEPTED';

  @ApiProperty({ description: 'Request ID (if pending)', required: false })
  requestId?: string;

  @ApiProperty({ description: 'Hint message', required: false })
  message?: string; // 补齐这个字段
}

// 3. 处理申请 Request
export class HandleGroupJoinDto {
  @ApiProperty({ description: 'Request ID from group_join_requests table' })
  @IsString()
  @IsNotEmpty()
  requestId!: string;

  @ApiProperty({ description: 'Action to take', enum: ['accept', 'reject'] })
  @IsEnum(['accept', 'reject'])
  @IsNotEmpty()
  action!: 'accept' | 'reject';
}

// 4. 申请列表项 DTO (用于 Response 数组)
export class GroupJoinRequestItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  reason!: string;

  @ApiProperty({ enum: GroupJoinRequestStatus })
  @ToNumber()
  status!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ description: 'Applicant basic info' })
  applicant!: {
    id: string;
    nickname: string;
    avatar: string;
  };
}

export class SearchGroupDto {
  @ApiProperty({
    description: 'Search keyword (Group ID or Name)',
    example: 'G10086',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  keyword!: string;
}

export class GroupSearchResultDto {
  @ApiProperty({ example: 'uuid-group-id' })
  id!: string;

  @ApiProperty({ example: 'Flutter Developers' })
  name!: string;

  @ApiProperty({ example: 'https://avatar.url...', required: false })
  avatar!: string | null;

  @ApiProperty({ example: 42, description: 'Current member count' })
  memberCount!: number;

  @ApiProperty({
    example: true,
    description: 'Whether approval is required to join',
  })
  joinNeedApproval!: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether the current user is already a member',
  })
  isMember!: boolean;
}
