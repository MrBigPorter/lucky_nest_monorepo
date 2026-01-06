import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class RefundResponseAdminDto {
  @ApiProperty({ description: '申请人ID (用户ID)' })
  @Expose()
  refundAppliedBy!: string;

  @ApiProperty({ description: '审核人ID (管理员ID)' })
  @Expose()
  refundAuditedBy!: string;

  @ApiProperty({ description: '第三方支付流水号 (Xendit ID)' })
  @Expose()
  transactionId!: string;

  @ApiProperty({ description: '支付方式' })
  @Expose()
  paymentMethod!: number;
}
