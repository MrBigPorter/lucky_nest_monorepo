import { Exclude, Expose, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DateToTimestamp, DecimalToString } from '@api/common/dto/transforms';

@Exclude()
export class RefundResponseClientDto {
  @ApiProperty({ description: '订单ID' })
  @Expose()
  orderId!: string;

  @ApiProperty()
  @Expose()
  orderNo!: string;

  @ApiProperty({ description: '状态: 1-退款中 2-成功 3-失败' })
  @Expose()
  refundStatus!: number;

  @ApiProperty({ description: '退款金额' })
  @Expose()
  @DecimalToString()
  refundAmount!: string;

  @ApiProperty({ description: '退款原因' })
  @Expose()
  refundReason!: string;

  @ApiProperty({ description: '拒绝原因 (如果有)' })
  @Expose()
  refundRejectReason!: string;

  @ApiProperty({ description: '处理时间' })
  @Expose()
  @DateToTimestamp()
  refundedAt!: number;
}
