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
  @IsNotEmpty()
  @IsNumber()
  @ToNumber()
  channelId!: number;
}
