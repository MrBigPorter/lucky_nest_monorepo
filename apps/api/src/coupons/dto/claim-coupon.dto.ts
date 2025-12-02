import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ClaimCouponDto {
  @ApiProperty({
    description: 'The ID of the coupon template to claim.',
    example: 'clxpfv2mn00003b6lejr45678',
  })
  @IsString()
  @IsNotEmpty()
  couponId: string;
}
