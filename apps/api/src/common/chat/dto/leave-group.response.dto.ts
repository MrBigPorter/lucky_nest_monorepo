import { ApiProperty } from '@nestjs/swagger';

export class LeaveGroupResponseDto {
  @ApiProperty({ description: 'success', example: true })
  success!: boolean;
}
