import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type, Transform } from 'class-transformer';
import { DateToTimestamp, DecimalToString } from '@api/common/dto/transforms';
import { PaginatedResponseDto } from '@api/common/dto/paginated-response.dto';

@Exclude()
export class MyCouponResponseDto {
  @ApiProperty({ description: '用户领取的优惠券实例 ID (userCoupon 表主键)' })
  @Expose()
  userCouponId!: string;

  @ApiProperty({ description: '状态: 0-未使用, 1-已使用, 2-已过期' })
  @Expose()
  status!: number;

  @ApiProperty({ description: '有效开始时间' })
  @Expose()
  @DateToTimestamp()
  validStartAt!: number;

  @ApiProperty({ description: '有效结束时间' })
  @Expose()
  @DateToTimestamp()
  validEndAt!: number;

  @ApiProperty({ description: '优惠券名称' })
  @Expose()
  couponName!: string;

  @ApiProperty({ description: '优惠券类型' })
  @Expose()
  couponType!: number;

  @ApiProperty({ description: '优惠面值' })
  @Expose()
  @DecimalToString()
  discountValue!: string;

  @ApiProperty({ description: '最低消费门槛' })
  @Expose()
  @DecimalToString()
  minPurchase!: string;

  @ApiProperty({ description: '使用规则描述', nullable: true })
  @Expose()
  ruleDesc?: string;
}

export class MyCouponListResponseDto extends PaginatedResponseDto<MyCouponResponseDto> {
  @ApiProperty({ isArray: true, type: MyCouponResponseDto })
  list!: MyCouponResponseDto[];
}
