import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ToInt, ToNumber } from '@api/common/dto/transforms';

// 1. 查询我的优惠券请求
export class QueryMyCouponsDto {
  @ApiProperty({ description: 'Page number', example: 1 })
  @IsNotEmpty()
  @ToNumber()
  @Min(1)
  page!: number;

  @ApiProperty({ description: 'Items per page', example: 10 })
  @IsNotEmpty()
  @ToNumber()
  @Min(1)
  pageSize!: number;

  @ApiPropertyOptional({
    description: '状态: 0-未使用, 1-已使用, 2-已过期 (不传则查全部)',
    example: 0,
  })
  @IsOptional()
  @ToInt()
  @IsIn([0, 1, 2])
  status?: number;

  // 💡 支付页扩展：传订单总金额，后端直接帮你过滤出“满足门槛”的券
  @ApiPropertyOptional({ description: '当前订单金额，用于过滤可用券' })
  @IsOptional()
  @ToNumber()
  orderAmount?: number;
}

// 2. 兑换码请求
export class RedeemCouponDto {
  @ApiProperty({ description: '兑换码口令', example: 'LUCKY2026' })
  @IsNotEmpty()
  @IsString()
  code!: string;
}
