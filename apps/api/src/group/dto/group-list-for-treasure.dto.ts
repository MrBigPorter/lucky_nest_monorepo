import {IsInt, IsOptional, IsString, Max, Min} from "class-validator";
import {ToNumber} from "@api/common/dto/transforms";
import {ApiPropertyOptional} from "@nestjs/swagger";

export class GroupListForTreasureDto {


    @ApiPropertyOptional({ description: 'treasureId', example: '1', type: String})
    @IsString()
    treasureId!: string;

    @ApiPropertyOptional({ description: 'page', example: 1, type: Number})
    @IsOptional()
    @ToNumber()
    @IsInt()
    @Min(1)
    page: number = 1

    @ApiPropertyOptional({ description: 'pageSize', example: 50, type: Number})
    @IsOptional()
    @ToNumber()
    @Min(1)
    @Max(100)
    pageSize: number = 50

}