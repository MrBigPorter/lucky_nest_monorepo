import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty } from 'class-validator';
import { ToNumber } from '@api/common/dto/transforms';

export class UpdateBannerStateDto {
  @ApiProperty({ description: 'state', example: '1', type: 'number' })
  @IsNotEmpty()
  @ToNumber()
  @IsInt()
  @IsIn([0, 1], { message: 'state must be 0(INACTIVE) or 1(ACTIVE)' })
  state!: number;
}
