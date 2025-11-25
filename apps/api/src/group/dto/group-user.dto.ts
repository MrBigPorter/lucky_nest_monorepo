import {ApiProperty} from "@nestjs/swagger";

export class GroupUserDto {
    @ApiProperty({ description: 'id', example: 'uuid-v4', type: String})
    id!: string;
    @ApiProperty({ description: 'username', example: 'alice', type: String})
    nickname!: string | null;
    @ApiProperty({ description: 'avatar', example: 'https://example.com/avatar.png', type: String, nullable: true})
    avatar!: string | null;
}