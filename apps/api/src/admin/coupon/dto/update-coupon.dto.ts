import { CreateCouponDto } from './create-coupon.dto';
import { PartialType, PickType } from '@nestjs/swagger';
export class UpdateCouponDto extends PartialType(
  PickType(CreateCouponDto, [
    'couponName',
    'totalQuantity',
    'validEndAt',
  ] as const),
) {}
