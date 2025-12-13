import { CreateCouponDto } from './create-coupon.dto';
import { PartialType } from '@nestjs/swagger';
export class UpdateCouponDto extends PartialType(CreateCouponDto) {}
