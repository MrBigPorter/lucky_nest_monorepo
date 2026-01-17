import { ApiProperty } from '@nestjs/swagger';

export class UserSimpleResponseDto {
  @ApiProperty({ description: '用户ID' })
  id!: string;

  @ApiProperty({ description: '昵称' })
  nickname!: string;

  @ApiProperty({ description: '头像', required: false })
  avatar?: string;

  @ApiProperty({ description: '邮箱 (用于确认)', required: false })
  email?: string;
}
