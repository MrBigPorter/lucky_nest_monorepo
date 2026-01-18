import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class MarkAsReadDto {
  @ApiProperty({
    description: '会话ID',
    example: 'conv_123456789',
  })
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @ApiProperty({
    description: '读到的最大序列号 (不传则默认标记为会话最新的一条)',
    required: false,
    example: 105,
  })
  @IsNumber()
  @IsOptional()
  maxSeqId?: number;
}
