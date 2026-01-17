import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchUserDto {
  @ApiProperty({
    description: '搜索关键字 (昵称/邮箱/手机号)',
    example: 'jack',
  })
  @IsString()
  @IsNotEmpty({ message: '搜索内容不能为空' })
  @MinLength(1, { message: '至少输入1个字符' }) // 甚至可以限制最少2个
  keyword!: string;
}
