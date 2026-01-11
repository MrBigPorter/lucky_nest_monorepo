import { GroupUserDto } from './group-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { DateToTimestamp } from '@api/common/dto/transforms';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
class MemberPreview {
  @ApiProperty({ description: 'isOwner', example: 1, type: Number })
  @Expose()
  isOwner!: number;

  @ApiProperty({
    description: 'joinedAt',
    example: 1704067200000,
    type: Number,
  })
  @DateToTimestamp()
  @Expose()
  joinedAt!: number;

  @ApiProperty({ description: 'user', type: GroupUserDto })
  @Expose()
  @Type(() => GroupUserDto) // 🔥 建议加上 @Type 确保嵌套转换正常
  user!: GroupUserDto;
}

@Exclude()
export class GroupForTreasureItemDto {
  @ApiProperty({ description: 'groupId', example: 'uuid-v4', type: String })
  @Expose()
  groupId!: string;

  @ApiProperty({ description: 'treasureId', example: '1', type: String })
  @Expose() // 🔥 必须加 @Expose，否则前端拿不到 ID
  treasureId!: string;

  @ApiProperty({ description: 'groupStatus', example: 1, type: Number })
  @Expose()
  groupStatus!: number;

  @ApiProperty({ description: 'currentMembers', example: 5, type: Number })
  @Expose()
  currentMembers!: number;

  @ApiProperty({ description: 'maxMembers', example: 10, type: Number })
  @Expose()
  maxMembers!: number;

  @ApiProperty({
    description: 'expireAt',
    example: 1704067200000,
    type: Number,
  })
  @DateToTimestamp()
  @Expose()
  expireAt!: number;

  @ApiProperty({
    description: 'updatedAt',
    example: 1704067200000,
    type: Number,
  })
  @DateToTimestamp()
  @Expose()
  updatedAt!: number;

  @ApiProperty({ description: 'creator', type: GroupUserDto })
  @Expose()
  @Type(() => GroupUserDto)
  creator!: GroupUserDto;

  @ApiProperty({ description: 'members', type: [MemberPreview] })
  @Expose()
  @Type(() => MemberPreview)
  members!: MemberPreview[];
}
