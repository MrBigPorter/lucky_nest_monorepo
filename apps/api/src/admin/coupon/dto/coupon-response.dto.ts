import { Exclude, Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DateToTimestamp, DecimalToString } from '@api/common/dto/transforms';
import { PaginatedResponseDto } from '@api/common/dto/paginated-response.dto';

@Exclude()
export class CouponResponseDto {
  @ApiProperty({ description: 'Coupon ID' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Coupon Name' })
  @Expose()
  couponName!: string;

  @ApiProperty({ description: 'Coupon Code' })
  @Expose()
  couponCode!: string;

  @ApiProperty({
    description: 'Coupon Type: 1-Full Reduction; 2-Discount; 3-No Threshold',
  })
  @Expose()
  couponType!: number;

  @ApiProperty({ description: 'Discount Type: 1-Amount; 2-Percentage' })
  @Expose()
  discountType!: number;

  @ApiProperty({ description: 'Discount Value' })
  @Expose()
  @DecimalToString()
  discountValue!: string;

  @ApiProperty({ description: 'Minimum Spend Required' })
  @Expose()
  @DecimalToString()
  minPurchase!: string;

  @ApiProperty({ description: 'already issue quantity' })
  @Expose()
  issuedQuantity!: number;

  @ApiProperty({ description: 'Total Quantity Issued' })
  @Expose()
  totalQuantity!: number;

  @ApiProperty({
    description: 'Coupon Status: 1-Active; 2-Inactive;',
  })
  @Expose()
  status!: number;

  @ApiProperty({
    description: 'Valid Type: 1-Fixed Date Range; 2-Days After Claim',
  })
  @Expose()
  validType!: number;

  @ApiProperty({
    description: 'Issue Type: 1-System; 2-Claim; 3-Redeem Code; 4-Invite',
  })
  @Expose()
  issueType!: number;

  @ApiProperty({ description: 'Valid From (timestamp)' })
  @Expose()
  @DateToTimestamp()
  validStartAt!: number;

  @ApiProperty({ description: 'Valid Until (timestamp)' })
  @Expose()
  @DateToTimestamp()
  validEndAt!: number;

  @ApiProperty({ description: 'Creation Time (timestamp)' })
  @Expose()
  @DateToTimestamp()
  createdAt!: number;

  @ApiPropertyOptional({ description: 'Description', required: false })
  @Expose()
  description?: string;

  @ApiPropertyOptional({ description: 'Subtitle', required: false })
  @Expose()
  subTitle?: string;

  @ApiPropertyOptional({
    description: 'Usage Rule Description',
    required: false,
  })
  @Expose()
  ruleDesc?: string;
}

export class CouponListResponseDto extends PaginatedResponseDto<CouponResponseDto> {
  @ApiProperty({ type: [CouponResponseDto] })
  @Expose()
  override list!: CouponResponseDto[];
}
