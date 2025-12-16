import { ApiProperty } from '@nestjs/swagger';
import { ToNumber } from '@api/common/dto/transforms';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateRechargeDto {
  @ApiProperty({ description: 'Recharge amount', example: 100.5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(10, { message: 'Minimum recharge amount is 10' })
  amount!: number;

  @ApiProperty({ description: 'Payment channel code', example: 'PAYPAL' })
  @IsOptional()
  @IsNumber()
  @ToNumber()
  channelCode?: number;

  @ApiProperty({
    description: 'Payment method: 1-EWallet 2-BankTransfer 3-QRCode',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @ToNumber()
  @IsIn([1, 2, 3])
  paymentMethod?: number;
}
