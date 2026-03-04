import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { DecimalToString } from '@api/common/dto/transforms';

@Exclude()
export class ClaimableCouponResponseDto {
  @ApiProperty({ description: '优惠券模板 ID' })
  @Expose()
  couponId!: string;

  @ApiProperty({ description: '优惠券名称' })
  @Expose()
  couponName!: string;

  @ApiProperty({ description: '类型: 1-满减券 2-折扣券 3-无门槛' })
  @Expose()
  couponType!: number;

  @ApiProperty({ description: '优惠面值 (String，防止精度丢失)' })
  @Expose()
  @DecimalToString()
  discountValue!: string;

  @ApiProperty({ description: '最低消费门槛' })
  @Expose()
  @DecimalToString()
  minPurchase!: string;

  @ApiProperty({ description: '发行总量 (-1 代表不限量)' })
  @Expose()
  totalQuantity!: number;

  @ApiProperty({ description: '已发放数量' })
  @Expose()
  issuedQuantity!: number;

  @ApiProperty({ description: '抢券进度百分比 (例如 "80" 代表 80%)' })
  @Expose()
  progress!: string;

  @ApiProperty({ description: '当前用户是否还可以领取' })
  @Expose()
  canClaim!: boolean;

  @ApiProperty({ description: '当前用户是否已经达到了个人限领上限' })
  @Expose()
  hasReachedLimit!: boolean;
}
