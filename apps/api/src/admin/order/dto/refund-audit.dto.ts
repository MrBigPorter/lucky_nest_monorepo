import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class RefundAuditDto {
  @IsNotEmpty()
  @IsString()
  orderId!: string;

  @IsNotEmpty()
  @IsString()
  rejectReason!: string;
}
