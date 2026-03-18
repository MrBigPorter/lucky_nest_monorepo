import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ToNumber } from '@api/common/dto/transforms';

export class CheckoutDto {
  @ApiProperty({
    description: 'Group ID for group purchase',
    example: 'groupId123',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  treasureId!: string;

  @ApiProperty({
    description: 'Number of entries to purchase',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @ToNumber()
  @IsInt()
  @Min(1)
  entries!: number;

  @ApiPropertyOptional({
    description: 'Group ID if joining a group purchase',
    example: 'groupId123',
    type: String,
  })
  @IsString()
  @IsOptional()
  groupId?: string;

  @ApiProperty({
    description:
      'Whether it is a group purchase (true) or solo purchase (false)',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @ApiPropertyOptional({
    description: 'Coupon ID to apply',
    example: 'couponId123',
    type: String,
  })
  @IsString()
  @IsOptional()
  couponId?: string;

  @ApiProperty({
    description: 'Payment method: 1 for cash, 2 for points',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @ToNumber()
  @IsInt()
  @IsIn([1, 2])
  paymentMethod!: number; // 1 cash 2 points

  @ApiPropertyOptional({
    description: 'Shipping address ID',
    example: 'addressId123',
    type: String,
  })
  @IsString()
  @IsOptional()
  addressId?: string;

  @ApiPropertyOptional({
    description:
      'Flash sale product ID (required when purchasing at flash sale price)',
    example: 'flashSaleProductId123',
    type: String,
  })
  @IsString()
  @IsOptional()
  flashSaleProductId?: string;
}
