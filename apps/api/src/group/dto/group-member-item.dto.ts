import {GroupUserDto} from "@api/group/dto/group-user.dto";
import {ApiProperty} from "@nestjs/swagger";

export  class GroupMemberItemDto {
    @ApiProperty({ description: 'id', example: 'uuid-v4', type: String})
    id!: string;
    @ApiProperty({ description: 'createdAt', example: 1704067200000, type: Number})
    createdAt!: number;
    @ApiProperty({description:'groupId', example: 'uuid-v4', type: String})
    groupId!: string;
    @ApiProperty({ description: 'userId', example: 'uuid-v4', type: String})
    userId!: string;
    @ApiProperty({ description: 'orderId', example: 'uuid-v4', type: String, nullable: true})
    orderId!: string | null;

    @ApiProperty({ description: 'isOwner', example: 1, type: Number})
    isOwner!: number;
    @ApiProperty({ description: 'shareCoin', example: 'BTC', type: String})
    shareCoin!: string;
    @ApiProperty({ description: 'shareAmount', example: '0.005', type: String})
    shareAmount!: string;
    @ApiProperty({ description: 'joinedAt', example: 1704067200000, type: Number})
    joinedAt!: number;

    @ApiProperty({ description: 'user', type: GroupUserDto})
    user!: GroupUserDto;

}