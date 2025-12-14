import { Exclude, Expose, Type } from 'class-transformer';
import { DateToTimestamp, DecimalToString } from '@api/common/dto/transforms';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
class UserSimpleDto {
  @ApiProperty({ description: 'Nickname', example: 'john_doe' })
  @Expose()
  nickname!: string;

  @ApiProperty({ description: 'Phone Number', example: '+1234567890' })
  @Expose()
  phone!: string;
}

@Exclude()
export class TransactionResponseDto {
  @ApiProperty({ description: 'Transaction ID', example: 'txn_123456' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Transaction Number', example: '202406120001' })
  @Expose()
  transactionNo!: string;

  @ApiProperty({ description: 'User ID', example: 'user_123456' })
  @Expose()
  userId!: string;

  @ApiProperty({ description: 'Amount', example: '100.00' })
  @Expose()
  @DecimalToString()
  amount!: string;

  @ApiProperty({ description: 'Balance Type', example: 1 })
  @Expose()
  balanceType!: number;

  @ApiProperty({ description: 'Transaction Type', example: 1 })
  @Expose()
  transactionType!: number;

  @ApiProperty({ description: 'Related ID', example: 'order_987654' })
  @Expose()
  relatedId?: string;

  @ApiProperty({ description: 'Related Type', example: 'order' })
  @Expose()
  relateType?: string;

  @ApiProperty({ description: 'Description', example: 'Recharge' })
  @Expose()
  description!: string;

  @ApiProperty({ description: 'Status', example: 2 })
  @Expose()
  status!: number;

  @ApiProperty({ description: 'before Balance', example: '500.00' })
  @Expose()
  @DecimalToString()
  beforeBalance!: string;

  @ApiProperty({ description: 'after Balance', example: '600.00' })
  @Expose()
  @DecimalToString()
  afterBalance!: string;

  @ApiProperty({ description: 'Remark', example: 'Recharge via credit card' })
  @Expose()
  remark!: string;

  @ApiProperty({ description: 'Created At (timestamp)', example: 1623456789 })
  @Expose()
  @DateToTimestamp()
  createdAt!: number;

  @ApiProperty({ description: 'User Info' })
  @Expose()
  @Type(() => UserSimpleDto)
  user?: UserSimpleDto;
}
