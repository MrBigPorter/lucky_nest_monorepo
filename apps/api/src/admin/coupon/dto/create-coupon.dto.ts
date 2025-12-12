import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  maxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ToDate, ToInt, ToNumber } from '@api/common/dto/transforms';

export class CreateCouponDto {
  @ApiProperty({
    description: 'Coupon Name',
    example: '新人满100减10',
    maxLength: 200,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  couponName!: string;

  @ApiPropertyOptional({
    description: '兑换码 (仅 issueType=3 时需要)',
    example: 'NEWUSER2024',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  couponCode?: string;

  @ApiProperty({
    description: '类型: 1-满减券 2-折扣券 3-无门槛',
    example: 1,
  })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @IsIn([1, 2, 3])
  couponType!: number;

  @ApiProperty({
    description: '优惠方式: 1-金额 2-百分比',
    example: 1,
  })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @IsIn([1, 2])
  discountType!: number;

  @ApiProperty({
    description: '优惠值 (满减金额或折扣百分比)',
    example: '10.00',
  })
  @IsNotEmpty()
  @ToNumber()
  @IsNumber()
  @Min(0.01)
  discountValue!: number;

  @ApiProperty({
    description: '最低消费金额 (仅 couponType=1 或 2 时需要)',
    example: '100.00',
    required: false,
  })
  @IsNotEmpty()
  @ToNumber()
  @IsNumber()
  @Min(0)
  minPurchase!: number;

  @ApiProperty({
    description: '最高优惠金额 (仅 couponType=2 时需要)',
    example: '50.00',
    required: false,
  })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  maxDiscount?: number;

  @ApiProperty({
    description: '发放方式: 1-自动发放 2-用户领取 3-兑换码兑换 4-邀请',
    example: 2,
  })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @IsIn([1, 2, 3, 4])
  issueType!: number;

  @ApiProperty({
    description: '总发行量',
    example: 1000,
  })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  totalQuantity!: number;

  @ApiProperty({
    description: '每人限领数量',
    example: 1,
  })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  perUserLimit!: number;

  @ApiProperty({
    description: '有效期类型: 1-日期范围 2-固定天数',
    example: 1,
  })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @IsIn([1, 2])
  validType!: number;

  @ApiProperty({
    description: '有效天数 (仅 validType=2 时需要)',
    example: 30,
    required: false,
  })
  @ValidateIf((o) => o.validType === 2)
  @ToInt()
  @IsInt()
  validDays?: number;

  @ApiPropertyOptional({
    description: '有效期开始时间 (仅 validType=1 时需要)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @ValidateIf((o) => o.validType === 1)
  @ToDate()
  @IsDateString()
  validStartAt?: string;

  @ApiProperty({
    description: '有效期结束时间 (仅 validType=1 时需要)',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @ValidateIf((o) => o.validType === 1)
  @ToDate()
  @IsDateString()
  validEndAt?: string;

  @ApiPropertyOptional({
    description: '描述',
    example: '这是一个新人专享优惠券',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: '副标题',
    example: '限时使用',
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subTitle?: string;

  @ApiPropertyOptional({
    description: '使用规则说明',
    example: '仅限新用户使用，满100元可用',
    maxLength: 1000,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  ruleDesc?: string;
}
