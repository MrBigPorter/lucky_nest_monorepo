import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty } from 'class-validator';
import { ToNumber } from '@api/common/dto/transforms';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description:
      'Admin-settable order status: 4=Cancelled, 5=Refunded, 8=Shipped, 9=Completed',
    example: 8,
  })
  @IsNotEmpty()
  @ToNumber()
  @IsInt()
  @IsIn([4, 5, 8, 9], {
    message:
      'Status must be one of: 4 (Cancelled), 5 (Refunded), 8 (Shipped), 9 (Completed)',
  })
  status!: number;
}
