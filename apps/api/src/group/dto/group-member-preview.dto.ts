import {GroupUserDto} from "@api/group/dto/group-user.dto";

export class GroupMemberPreviewDto {
    isOwner!: number;      // 0 / 1，对应 IS_OWNER
    joinedAt!: Date;       // 加入时间
    user!: GroupUserDto;   // 成员用户信息
}