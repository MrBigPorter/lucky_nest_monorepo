import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LeaveGroupDto {
  @ApiProperty({
    description: 'group id',
    example: 'cmjpq64p80001qo34qeyqmr37',
  })
  @IsString()
  @IsNotEmpty()
  groupId!: string;
}
