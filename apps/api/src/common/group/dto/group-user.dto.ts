import { ApiProperty } from '@nestjs/swagger';
import { MaskString } from '@api/common/dto/transforms';

export class GroupUserDto {
  @ApiProperty({ description: 'id', example: 'uuid-v4', type: String })
  id!: string;
  @ApiProperty({ description: 'username', example: 'alice', type: String })
  @MaskString('name')
  nickname!: string | null;
  @ApiProperty({
    description: 'avatar',
    example: 'https://example.com/avatar.png',
    type: String,
    nullable: true,
  })
  avatar!: string | null;
}
