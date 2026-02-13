import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForwardMessageDto {
  @ApiProperty({ description: 'Original message ID to be forwarded' })
  @IsString()
  @IsNotEmpty()
  originalMsgId!: string;

  @ApiProperty({ description: 'Target conversation IDs' })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  targetConversationIds!: string[];
}
