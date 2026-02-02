import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, Length } from 'class-validator';

export class AddFriendDto {
  @ApiProperty({ description: 'Target User ID (UUID)', example: 'clx...' })
  @IsString()
  @IsNotEmpty()
  friendId!: string;

  @ApiProperty({
    description: 'Verification message',
    example: '我是老王',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  reason?: string;
}
