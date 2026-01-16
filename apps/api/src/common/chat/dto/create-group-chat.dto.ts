import {
  IsArray,
  IsNotEmpty,
  IsString,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupChatDto {
  @ApiProperty({ description: '群名称', example: '周末饭局' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20, { message: '群名不能超过20个字符' })
  name!: string;

  @ApiProperty({ description: '成员ID列表', example: ['u_1', 'u_2'] })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1, { message: '建群至少需要拉1个人' })
  @IsString({ each: true }) // 确保数组里每个都是 string
  members!: string[];
}
