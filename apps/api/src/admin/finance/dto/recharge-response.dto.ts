import { Exclude, Expose, Type } from 'class-transformer';
import { DateToTimestamp, DecimalToString } from '@api/common/dto/transforms';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
class UserSimpleDto {
  @ApiProperty({ description: 'User ID', example: 'user_12345' })
  @Expose()
  nickname!: string;

  @ApiProperty({ description: 'User Nickname', example: 'john_doe' })
  @Expose()
  phone!: string;
}

@Exclude()
export class RechargeResponseDto {
  @ApiProperty({ description: 'Recharge ID', example: 'recharge_12345' })
  @Expose()
  rechargeId!: string;

  @ApiProperty({
    description: 'Recharge Order Number',
    example: 'recharge_12345',
  })
  @Expose()
  rechargeNo!: string;

  @ApiProperty({ description: 'recharge Amount', example: '100.00' })
  @Expose()
  @DecimalToString()
  rechargeAmount!: string;

  @ApiProperty({
    description:
      'Recharge Status:PENDING: 1,PROCESSING: 2,SUCCESS: 3,FAILED: 4,CANCELED: 5,',
    example: 1,
  })
  @Expose()
  rechargeStatus!: number;

  @ApiProperty({
    description: 'Payment Method: GCASH: 1,PAYMAYA: 2,BANK_TRANSFER: 3,CARD: 4',
  })
  @Expose()
  paymentMethod!: number;

  @ApiProperty({
    description: 'Third Party Order Number',
    example: 'TP1234567890',
    required: false,
  })
  @Expose()
  thirdPartyOrderNo?: string;

  @ApiProperty({
    description: 'Created At (Timestamp)',
    example: 1622547800000,
  })
  @Expose()
  @DateToTimestamp()
  createdAt!: number;

  @ApiProperty({ description: 'User Info' })
  @Expose()
  @Type(() => UserSimpleDto)
  user!: UserSimpleDto;
}
