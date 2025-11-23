import {IsInt, IsOptional, IsString, Max, Min} from "class-validator";
import {ToNumber} from "@api/common/dto/transforms";
import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";

export class GroupListForTreasureDto {


    @ApiProperty({ description: 'treasureId', example: '1', type: String})
    @IsString()
    treasureId!: string;

    @ApiProperty({ description: 'page', example: 1, type: Number})
    @ToNumber()
    @IsInt()
    @Min(1)
    page: number = 1

    @ApiPropertyOptional({ description: 'pageSize', example: 50, type: Number})
    @ToNumber()
    @Min(1)
    @Max(100)
    pageSize: number = 50

}