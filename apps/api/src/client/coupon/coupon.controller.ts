import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { plainToInstance } from 'class-transformer';
import { ClientCouponService } from '@api/client/coupon/coupon.service';
import { MyCouponListResponseDto } from '@api/client/coupon/dto/my-coupon-response-dto';
import {
  QueryMyCouponsDto,
  RedeemCouponDto,
} from '@api/client/coupon/dto/query-my-coupons-dto';
import { CurrentUserId } from '@api/common/decorators/user.decorator';

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
      list: plainToInstance(MyCouponListResponseDto, result.list, {
        excludeExtraneousValues: true,
      }),
    };
  }

  /**
   * Claim a coupon by its ID (only for coupons with issueType = 2)
   * @param userId
   * @param couponId
   */
  @Post('claim/:couponId')
  async claimCoupon(
    @CurrentUserId() userId: string,
    @Param('couponId') couponId: string,
  ) {
    // 限制必须是 issueType = 2 (用户手动领取) 的券
    await this.clientCouponService.claimCoupon(userId, couponId, 2);
    return { success: true, message: 'Coupon claimed successfully' };
  }

  /**
   * Redeem a coupon code (for coupons with issueType = 3)
   * @param userId
   * @param dto
   */
  @Post('redeem')
  async redeemCoupon(
    @CurrentUserId() userId: string,
    @Body() dto: RedeemCouponDto,
  ) {
    return this.clientCouponService.redeemCode(userId, dto.code);
  }
}
