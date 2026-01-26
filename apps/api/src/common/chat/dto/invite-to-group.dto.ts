import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class InviteToGroupDto {
  @ApiProperty({
    description: 'group id',
    example: 'cmjpq64p80001qo34qeyqmr37',
  })
  @IsString()
  @IsNotEmpty()
  groupId!: string;

  @ApiProperty({ description: 'members id', example: ['user_1', 'user_2'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  memberIds!: string[];
}
