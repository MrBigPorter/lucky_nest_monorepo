import { ApiProperty } from '@nestjs/swagger';
import { ToNumber } from '@api/common/dto/transforms';
import { IsIn, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateRechargeDto {
  @ApiProperty({ description: 'Recharge amount', example: 100.5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(10, { message: 'Minimum recharge amount is 10' })
  amount!: number;

  @ApiProperty({ description: 'Payment channel code', example: 'PAYPAL' })
  @IsNotEmpty()
  @IsNumber()
  @ToNumber()
  channelCode?: string;

  @ApiProperty({
    description: 'Payment method: 1-EWallet 2-BankTransfer 3-QRCode',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @ToNumber()
  @IsIn([1, 2, 3])
  paymentMethod?: number;
}
