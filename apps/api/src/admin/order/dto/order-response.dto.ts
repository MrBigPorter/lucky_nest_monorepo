import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '@api/common/dto/paginated-response.dto';

export class OrderUserDto {
  @ApiProperty({ description: 'User ID' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Nickname' })
  @Expose()
  nickname!: string;

  @ApiProperty({ description: 'Phone number' })
  @Expose()
  phone!: string;
}

export class OrderTreasureDto {
  @ApiProperty({ description: 'Treasure ID' })
  @Expose()
  treasureId!: string;

  @ApiProperty({ description: 'Treasure name' })
  @Expose()
  treasureName!: string;

  @ApiProperty({ description: 'Treasure cover image URL' })
  @Expose()
  treasureCoverImg!: string;
}

@Exclude()
export class OrderResponseDto {
  @ApiProperty({ description: 'Order ID' })
  @Expose()
  orderId!: string;

  @ApiProperty({ description: 'Order number' })
  @Expose()
  orderNo!: string;

  @ApiProperty({ description: 'original amount' })
  @Expose()
  @Transform(({ value }) => (value ? Number(value) : value))
  originalAmount!: number;

  @ApiProperty({ description: 'final amount' })
  @Expose()
  @Transform(({ value }) => (value ? Number(value) : value))
  finalAmount!: number;

  @ApiProperty({ description: 'coupon amount' })
  @Expose()
  @Transform(({ value }) => (value ? Number(value) : value))
  couponAmount!: number;

  @ApiProperty({ description: 'coin amount' })
  @Expose()
  @Transform(({ value }) => (value ? Number(value) : value))
  coinAmount!: number;

  @ApiProperty({ description: 'buy quantity' })
  @Expose()
  buyQuantity!: number;

  @ApiProperty({ description: 'unit price' })
  @Expose()
  @Transform(({ value }) => (value ? Number(value) : value))
  unitPrice!: number;

  @ApiProperty({ description: 'Order status: 1 - pending 2-paid' })
  @Expose()
  orderStatus!: number;

  @ApiProperty({ description: 'Payment time (timestamp in ms)' })
  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.getTime() : value))
  paidAt!: number | null;

  @ApiProperty({ description: 'Creation time (timestamp in ms)' })
  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.getTime() : value))
  createdAt!: number;

  @ApiProperty({ description: 'User information', type: OrderUserDto })
  @Expose()
  @Type(() => OrderUserDto)
  user!: OrderUserDto;

  @ApiProperty({ description: 'Treasure information', type: OrderTreasureDto })
  @Expose()
  @Type(() => OrderTreasureDto)
  treasure!: OrderTreasureDto;
}
