import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RedeemCouponDto } from './dto/redeem-coupon.dto';
import { ClaimCouponDto }from './dto/claim-coupon.dto';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('my')
  @ApiOperation({ summary: '查询我的优惠券' })
  async getMyCoupons(@Req() req, @Query('status') status: number) {
    const userId = req.user.id;
    return this.couponsService.findUserCoupons(userId, +status);
  }

  @UseGuards(JwtAuthGuard)
  @Get('available')
  @ApiOperation({ summary: '查询订单可用的优惠券' })
  async getAvailableCoupons(
    @Req() req,
    @Query('orderAmount') orderAmount: number,
    @Query('treasureIds') treasureIds: string,
  ) {
    const userId = req.user.id;
    const treasureIdArray = treasureIds.split(',');
    return this.couponsService.findAvailableCouponsForOrder(userId, +orderAmount, treasureIdArray);
  }

  @UseGuards(JwtAuthGuard)
  @Post('claim')
  @ApiOperation({ summary: '用户领取优惠券' })
  async claimCoupon(@Req() req, @Body() claimCouponDto: ClaimCouponDto) {
    const userId = req.user.id;
    return this.couponsService.claimCoupon(userId, claimCouponDto.couponId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('redeem')
  @ApiOperation({ summary: '兑换码兑换优惠券' })
  async redeemCoupon(@Req() req, @Body() redeemCouponDto: RedeemCouponDto) {
    const userId = req.user.id;
    return this.couponsService.redeemCoupon(userId, redeemCouponDto.code);
  }
}
