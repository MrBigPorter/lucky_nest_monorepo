import { ApiProperty } from '@nestjs/swagger';

export class InviteToGroupResponseDto {
  @ApiProperty({ description: 'count of members', example: 3 })
  count!: number;
}
