import { GroupUserDto } from './group-user.dto';
import { ApiProperty } from '@nestjs/swagger';

class MemberPreview {
  @ApiProperty({ description: 'isOwner', example: 1, type: Number })
  isOwner!: number;
  @ApiProperty({
    description: 'joinedAt',
    example: 1704067200000,
    type: Number,
  })
  joinedAt!: number;
  @ApiProperty({ description: 'user', type: GroupUserDto })
  user!: GroupUserDto;
}

export class GroupForTreasureItemDto {
  @ApiProperty({ description: 'groupId', example: 'uuid-v4', type: String })
  groupId!: string;
  @ApiProperty({ description: 'treasureId', example: '1', type: String })
  treasureId!: string;

  @ApiProperty({ description: 'groupStatus', example: 1, type: Number })
  groupStatus!: number; // GROUP_STATUS.ACTIVE 等
  @ApiProperty({ description: 'currentMembers', example: 5, type: Number })
  currentMembers!: number; // 当前人数
  @ApiProperty({ description: 'maxMembers', example: 10, type: Number })
  maxMembers!: number; // 最大人数
  @ApiProperty({
    description: 'createdAt',
    example: 1704067200000,
    type: Number,
  })
  updatedAt!: number; // 用于排序 / 展示

  @ApiProperty({ description: 'creator', type: GroupUserDto })
  creator!: GroupUserDto; // 开团人
  @ApiProperty({ description: 'members', type: [MemberPreview] })
  members!: MemberPreview[]; // 成员预览（最多 8 个）
}
