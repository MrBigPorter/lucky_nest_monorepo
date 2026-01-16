import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDirectChatDto {
  @ApiProperty({ description: '对方的用户ID', example: 'user_456' })
  @IsNotEmpty()
  @IsString()
  targetUserId!: string;
}
