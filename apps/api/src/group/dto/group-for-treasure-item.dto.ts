import { GroupUserDto } from './group-user.dto';
import { GroupMemberPreviewDto } from './group-member-preview.dto';

export class GroupForTreasureItemDto {
    groupId!: string;
    treasureId!: string;

    groupStatus!: number;       // GROUP_STATUS.ACTIVE 等
    currentMembers!: number;    // 当前人数
    maxMembers!: number;        // 最大人数
    updatedAt!: Date;           // 用于排序 / 展示

    creator!: GroupUserDto;              // 开团人
    members!: GroupMemberPreviewDto[];   // 成员预览（最多 8 个）
}