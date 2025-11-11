import {IsString} from "class-validator";
import {ApiPropertyOptional} from "@nestjs/swagger";

export class GroupJoinDto {
    @ApiPropertyOptional({ description: 'Group Id', example: '1', type: String})
    @IsString()
    groupId!: string;

    @ApiPropertyOptional({ description: 'User Id', example: '1', type: String})
    @IsString()
    userId!: string;

    @ApiPropertyOptional({ description: 'Order Id', example: '1', type: String})
    @IsString()
    orderId!: string;
}