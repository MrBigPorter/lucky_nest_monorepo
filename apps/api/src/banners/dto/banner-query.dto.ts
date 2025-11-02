import {IsInt,IsNumber, IsOptional, Min} from "class-validator";
import {ToNumber} from "@api/common/dto/transforms";
import {ApiPropertyOptional} from "@nestjs/swagger";

export class BannerQueryDto {

    @ApiPropertyOptional({ description: 'Banner category — 1 = Home page; 2 = Event page; 3 = Product page', example: 1, type: Number})
    @IsOptional()
    @ToNumber()
    @IsNumber()
    @IsInt()
    @Min(1)
    bannerCate: number = 1;

    @ApiPropertyOptional({ description: 'Banner position — 0 = Top; 1 = Middle; 2 = Bottom', example: 0, type: Number})
    @IsOptional()
    @ToNumber()
    @IsNumber()
    @IsInt()
    position?: number;

    @ApiPropertyOptional({ description: 'Banner state — 0 = Inactive; 1 = Active', example: 1, type: Number})
    @IsOptional()
    @ToNumber()
    @IsNumber()
    @IsInt()
    state?: number = 1;

    @ApiPropertyOptional({ description: 'Banner validState — 0 = Not validated; 1 = Validated', example: 1, type: Number})
    @IsOptional()
    @ToNumber()
    @IsNumber()
    @IsInt()
    validState?: number = 1;

    @ApiPropertyOptional({ description: 'Number of banners to return', example: 10, type: Number})
    @IsOptional()
    @ToNumber()
    @IsNumber()
    @IsInt()
    limit?: number = 10;
}