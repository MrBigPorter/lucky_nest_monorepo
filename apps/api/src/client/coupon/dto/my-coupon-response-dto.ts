import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DateToTimestamp, DecimalToString } from '@api/common/dto/transforms';
import { PaginatedResponseDto } from '@api/common/dto/paginated-response.dto';

@Exclude()
export class MyCouponResponseDto {
  @ApiProperty({ description: '用户优惠券实例ID (下单抵扣时传这个ID)' })
  @Expose()
  userCouponId!: string;

  @ApiProperty({ description: '使用状态: 0-未使用, 1-已使用, 2-已过期' })
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

  // --- 模板属性 (来自 Coupon 表) ---
  @ApiProperty({ description: '券名' })
  @Expose()
  couponName!: string;

  @ApiProperty({ description: '类型: 1-满减 2-折扣 3-无门槛' })
  @Expose()
  couponType!: number;

  @ApiProperty({ description: '优惠数值 (减多少钱，或打几折)' })
  @Expose()
  @DecimalToString()
  discountValue!: string;

  @ApiProperty({ description: '最低消费门槛' })
  @Expose()
  @DecimalToString()
  minPurchase!: string;

  @ApiProperty({ description: '使用规则描述' })
  @Expose()
  ruleDesc?: string;
}

export class MyCouponListResponseDto extends PaginatedResponseDto<MyCouponResponseDto> {
  @ApiProperty({ type: [MyCouponResponseDto] })
  @Expose()
  override list!: MyCouponResponseDto[];
}
