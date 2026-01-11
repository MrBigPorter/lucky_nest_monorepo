import { GroupUserDto } from './group-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { DateToTimestamp, DecimalToString } from '@api/common/dto/transforms';
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
  @Type(() => GroupUserDto)
  user!: GroupUserDto;
}

@Exclude()
class GroupTreasurePreviewDto {
  @ApiProperty({ description: '商品ID', example: '1' })
  @Expose()
  treasureId!: string;

  @ApiProperty({ description: '商品名称', example: 'iPhone 15' })
  @Expose()
  treasureName!: string;

  @ApiProperty({ description: '商品封面图', example: 'https://...' })
  @Expose()
  treasureCoverImg!: string;

  @ApiProperty({ description: '拼团价', example: 100 })
  @Expose()
  @DecimalToString()
  unitAmount!: number;
}

@Exclude()
export class GroupForTreasureItemDto {
  @ApiProperty({ description: 'groupId', example: 'uuid-v4', type: String })
  @Expose()
  groupId!: string;

  @ApiProperty({ description: 'isJoined', example: true, type: Boolean })
  @Expose()
  isJoined!: boolean;

  @ApiProperty({ description: 'treasureId', example: '1', type: String })
  @Expose()
  treasureId!: string;

  // 只有当 Service 查了 include: { treasure: true } 时，这里才会有值
  @ApiProperty({
    description: '关联的商品信息(广场模式才有)',
    type: GroupTreasurePreviewDto,
  })
  @Expose()
  @Type(() => GroupTreasurePreviewDto)
  treasure?: GroupTreasurePreviewDto;

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
