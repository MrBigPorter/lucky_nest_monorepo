import { IsNotEmpty, IsString } from 'class-validator';

export class RefundApplyDto {
  @IsNotEmpty()
  @IsString()
  orderId!: string;

  @IsNotEmpty()
  @IsString()
  reason!: string;
}
