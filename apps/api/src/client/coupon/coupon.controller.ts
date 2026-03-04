import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { plainToInstance } from 'class-transformer';
import { ClientCouponService } from '@api/client/coupon/coupon.service';
import {
  MyCouponListResponseDto,
  MyCouponResponseDto,
} from '@api/client/coupon/dto/my-coupon-response-dto';
import {
  QueryMyCouponsDto,
  RedeemCouponDto,
} from '@api/client/coupon/dto/query-my-coupons-dto';
import { CurrentUserId } from '@api/common/decorators/user.decorator';
import { ClaimableCouponResponseDto } from '@api/client/coupon/dto/claimable-coupon-response.dto';
import { CouponActionResponseDto } from '@api/client/coupon/dto/coupon-action-response.dto';

@ApiTags('Client Coupons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('client/coupons')
export class ClientCouponController {
  constructor(private readonly clientCouponService: ClientCouponService) {}

  /**
   * Get the list of coupons for the current user with optional filters
   * @param userId
   * @param dto
   */
  @Get('me')
  @ApiOkResponse({ type: MyCouponListResponseDto })
  async getMyCoupons(
    @CurrentUserId() userId: string,
    @Query() dto: QueryMyCouponsDto,
  ) {
    const result = await this.clientCouponService.getMyCoupons(userId, dto);

    return {
      ...result,
      list: plainToInstance(MyCouponResponseDto, result.list),
    };
  }

  /**
   * Claim a coupon by its ID (only for coupons with issueType = 2)
   * @param userId
   * @param couponId
   */
  @Post('claim/:couponId')
  @ApiOkResponse({ type: CouponActionResponseDto })
  async claimCoupon(
    @CurrentUserId() userId: string,
    @Param('couponId') couponId: string,
  ) {
    // 限制必须是 issueType = 2 (用户手动领取) 的券
    return this.clientCouponService.claimCoupon(userId, couponId, 2);
  }
  /**
   * Redeem a coupon code (for coupons with issueType = 3)
   * @param userId
   * @param dto
   */
  @Post('redeem')
  @ApiOkResponse({ type: CouponActionResponseDto })
  async redeemCoupon(
    @CurrentUserId() userId: string,
    @Body() dto: RedeemCouponDto,
  ) {
    return this.clientCouponService.redeemCode(userId, dto.code);
  }

  /**
   * Get the list of claimable coupons for the Voucher Center (Level 3)
   * @param userId
   */
  @Get('claimable')
  @ApiOkResponse({
    description: '返回可领取的优惠券列表',
    type: [ClaimableCouponResponseDto],
  })
  async getClaimableCoupons(@CurrentUserId() userId: string) {
    const result = await this.clientCouponService.getClaimableCoupons(userId);

    // 返回的是数组，直接转换
    return plainToInstance(ClaimableCouponResponseDto, result);
  }
}
