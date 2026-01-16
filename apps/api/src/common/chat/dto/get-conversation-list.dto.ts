import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ToInt } from '@api/common/dto/transforms';

export class GetConversationListDto {
  @ApiProperty({ description: '页码 (从1开始)', required: false, example: 1 })
  @IsOptional()
  @ToInt()
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码最小为1' })
  page?: number = 1; // 默认值
}
