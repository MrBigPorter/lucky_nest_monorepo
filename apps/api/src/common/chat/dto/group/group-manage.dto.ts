import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';

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

  @ApiProperty({ description: 'New group announcement', required: false })
  @IsString()
  @IsOptional()
  announcement?: string;

  @ApiProperty({
    description: 'Enable/Disable mute all for the group',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isMuteAll?: boolean;

  @ApiProperty({ description: 'Require approval to join', required: false })
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
  @IsBoolean()
  isAdmin!: boolean;
}

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

// 3. Update Group Info Response (Snapshot)
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
