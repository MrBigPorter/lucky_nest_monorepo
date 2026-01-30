import { IsOptional, IsString, IsNumber, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MessageMetaDto {
  @ApiProperty({
    description: '视觉指纹算法生成的 Hash 字符串',
    required: false,
  })
  @IsOptional()
  @IsString()
  blurHash?: string;

  @ApiProperty({ description: '原始逻辑宽度', required: false })
  @IsOptional()
  @IsNumber()
  w?: number;

  @ApiProperty({ description: '原始逻辑高度', required: false })
  @IsOptional()
  @IsNumber()
  h?: number;

  @ApiProperty({ description: '媒体时长 (秒/毫秒)', required: false })
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiProperty({ description: '封面图/缩略图的远程路径', required: false })
  @IsOptional()
  @IsString()
  thumb?: string;

  @ApiProperty({
    description: '本地资产 ID (仅用于前端回显引用)',
    required: false,
  })
  @IsOptional()
  @IsString()
  localAssetId?: string;
}
