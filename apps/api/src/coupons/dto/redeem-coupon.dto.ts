import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RedeemCouponDto {
  @ApiProperty({
    description: 'The redemption code for the coupon.',
    example: 'WELCOME2025',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
