import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { DecimalToString } from '@api/common/dto/transforms';

@Exclude()
export class RechargeCreateResponseDto {
  @ApiProperty({ description: 'Recharge ID', example: 'recharge_12345' })
  @Expose()
  rechargeNo!: string;

  @ApiProperty({ description: 'Recharge Amount', example: '100.50' })
  @Expose()
  @DecimalToString()
  rechargeAmount!: string;

  @ApiProperty({
    description: 'Payment URL',
    example: 'https://payment.gateway/pay',
  })
  @Expose()
  payUrl!: string;
}
