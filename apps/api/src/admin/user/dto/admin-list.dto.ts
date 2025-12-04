import {IsInt, IsOptional, IsString, Min} from "class-validator";
import {ToNumber} from "@api/common/dto/transforms";
import {ApiProperty} from "@nestjs/swagger";

export class AdminListDto {
    @ApiProperty({description:"page", example:'1', type: Number})
    @IsOptional()
    @ToNumber()
    @IsInt()
    @Min(1)
    page?:number = 1;

    @ApiProperty({description:"pageSize", example:'10', type: Number})
    @IsOptional()
    @ToNumber()
    @IsInt()
    @Min(10)
    pageSize?:number = 10;

    @ApiProperty({description:"username", example:'admin', type: String})
    @IsOptional()
    @IsString()
    username?:string;

    @ApiProperty({description:"realName", example:'admin', type: String})
    @IsOptional()
    @IsString()
    realName?:string;

    @ApiProperty({description:"role", example:'admin', type: String})
    @IsOptional()
    @IsString()
    role?:string;

    @ApiProperty({description:"status", example:'1', type: Number})
    @IsOptional()
    @ToNumber()
    @IsInt()
    status?:number;
}