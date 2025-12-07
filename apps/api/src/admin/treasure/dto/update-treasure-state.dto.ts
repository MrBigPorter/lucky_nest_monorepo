import { ToNumber } from '@api/common/dto/transforms';
import { IsIn, IsInt, IsNotEmpty, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTreasureStateDto {
  @ApiProperty({ description: 'state', example: '1', type: 'number' })
  @IsNotEmpty()
  @ToNumber()
  @IsInt()
  @IsIn([0, 1], { message: 'state must be 0(INACTIVE) or 1(ACTIVE)' })
  state!: number;
}
