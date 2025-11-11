import {IsString} from "class-validator";
import {ApiPropertyOptional} from "@nestjs/swagger";

export class GroupLeaveDto {
    @ApiPropertyOptional({ description: 'Group Id', example: '1', type: String})
    @IsString()
    groupId!: string;

    @ApiPropertyOptional({ description: 'User Id', example: '1', type: String})
    @IsString()
    userId!: string;

}