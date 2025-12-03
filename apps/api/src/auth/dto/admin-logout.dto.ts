import {IsNotEmpty, IsString} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";

export  class AdminLogoutDto {
    @ApiProperty({description: 'username', example: 'admin', type: String})
    @IsNotEmpty()
    @IsString()
    username!: string;

    @ApiProperty({description: 'adminId', example: '123456', type: String})
    @IsNotEmpty()
    @IsString()
    adminId!: string;
}