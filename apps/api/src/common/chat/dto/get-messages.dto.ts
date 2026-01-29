import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ToInt } from '@api/common/dto/transforms';

export class GetMessagesDto {
  @ApiProperty({ description: '会话ID' })
  @IsString()
  @IsNotEmpty()
  conversationId!: string;

  @ApiProperty({
    description: '游标：上一页最后一条消息的ID (第一页不传)',
    required: false,
  })
  @ToInt()
  @IsInt()
  @IsOptional()
  cursor?: number;

  @ApiProperty({ description: '每页条数', default: 20, required: false })
  @IsOptional()
  @ToInt()
  @IsInt()
  @Min(1)
  pageSize?: number = 20;
}
