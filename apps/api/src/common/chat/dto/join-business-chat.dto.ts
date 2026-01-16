import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinBusinessChatDto {
  @ApiProperty({ description: '业务ID (如GroupId)', example: 'group_123' })
  @IsNotEmpty()
  @IsString()
  businessId!: string;
}
