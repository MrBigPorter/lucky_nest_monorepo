import { ApiProperty } from '@nestjs/swagger';
import { DateToTimestamp } from '@api/common/dto/transforms';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
class GroupMemberUserDto {
  @ApiProperty({ description: '用户ID' })
  @Expose()
  id!: string;

  @ApiProperty({ description: '昵称' })
  @Expose()
  nickname!: string;

  @ApiProperty({ description: '头像' })
  @Expose()
  avatar!: string;
}

// 2. 定义成员信息
@Exclude()
class GroupMemberDto {
  @ApiProperty({ description: '是否是团长: 1=是, 0=否' })
  @Expose()
  isOwner!: number;

  @ApiProperty({ description: '加入时间' })
  @DateToTimestamp()
  @Expose()
  joinedAt!: number;

  @ApiProperty({ type: GroupMemberUserDto })
  @Type(() => GroupMemberUserDto)
  @Expose()
  user!: GroupMemberUserDto;
}

// 3. 定义商品简略信息
@Exclude()
class GroupTreasureDto {
  @ApiProperty({ description: '商品ID' })
  @Expose()
  treasureId!: string;

  @ApiProperty({ description: '商品名称' })
  @Expose()
  treasureName!: string;

  @ApiProperty({ description: '封面图' })
  @Expose()
  treasureCoverImg!: string;
}

// 4. 最外层：团详情 Response DTO
@Exclude()
export class GroupDetailResponseDto {
  @ApiProperty({ description: '团ID' })
  @Expose()
  groupId!: string;

  @ApiProperty({ description: '团状态: 1-进行中 2-成功 3-失败' })
  @Expose()
  groupStatus!: number;

  @ApiProperty({ description: '当前人数' })
  @Expose()
  currentMembers!: number;

  @ApiProperty({ description: '最大人数' })
  @Expose()
  maxMembers!: number;

  @ApiProperty({ description: '过期时间' })
  @DateToTimestamp()
  @Expose()
  expireAt!: number;

  @ApiProperty({ type: GroupTreasureDto })
  @Type(() => GroupTreasureDto)
  @Expose()
  treasure!: GroupTreasureDto;

  @ApiProperty({ type: [GroupMemberDto], description: '成员列表' })
  @Type(() => GroupMemberDto)
  @Expose()
  members!: GroupMemberDto[];
}
