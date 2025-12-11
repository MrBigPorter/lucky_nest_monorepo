import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty } from 'class-validator';
import { ToNumber } from '@api/common/dto/transforms';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Order status: 3 - Cancelled; 5 - Refunded; 6 - Completed',
    example: 3,
  })
  @IsNotEmpty()
  @ToNumber()
  @IsInt()
  @IsIn([3, 5, 6], {
    message:
      'Status must be one of the following values: 3 (Cancelled), 5 (Refunded), 6 (Completed)',
  })
  status!: number;
}
