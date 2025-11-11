import {IsBoolean, IsInt, IsOptional, Min} from "class-validator";
import {Transform, Type} from "class-transformer";
import {ApiPropertyOptional} from "@nestjs/swagger";
import {ToBool, ToNumber} from "@api/common/dto/transforms";

export class CategoryQueryDto {
    @ApiPropertyOptional({description: "state (0=blocked, 1=enabled)",example: 1, type: Number})
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    @ToNumber()
    state?: number;

    @ApiPropertyOptional({description: "withCounts",example: false, type: Boolean})
    @IsOptional()
    @IsBoolean()
    @ToBool()
    withCounts?: boolean = false;
}