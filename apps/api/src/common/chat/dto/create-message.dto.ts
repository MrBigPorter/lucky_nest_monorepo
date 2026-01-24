import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ description: 'Message ID' })
  @IsString()
  @IsNotEmpty()
  id!: string; //  核心新增：必填，不再依赖后端生成

  @ApiProperty({ description: 'Conversation ID' })
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @ApiProperty({ description: 'Message content (Text or URL)' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({
    description: 'Message type (0: Text, 1: Image, 2: Audio)',
    default: 0,
  })
  @IsInt()
  @IsOptional()
  type: number = 0;

  @ApiProperty({
    description: 'Audio duration in seconds (Required if type is 2)',
    required: false,
  })
  @IsInt()
  @IsOptional()
  duration?: number; // Added: Optional parameter for audio duration

  @ApiProperty({
    description: 'Image width in pixels (Required if type is 1)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  width?: number;

  @ApiProperty({
    description: 'Image height in pixels (Required if type is 1)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  height?: number;
}
