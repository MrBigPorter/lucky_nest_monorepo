import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Exclude } from 'class-transformer';
import { DecimalToString, DateToTimestamp } from '@api/common/dto/transforms'; // 假设您有这些工具

@Exclude()
export class TransactionResponseDto {
  @ApiProperty({ example: 'txn_123456', description: 'Transaction ID' })
  @Expose()
  transactionNo!: string;

  @ApiProperty({ example: 3, description: 'Transaction Type' })
  @Expose()
  transactionType!: number;

  @ApiProperty({ example: '250.00', description: 'Transaction Amount' })
  @Expose()
  @DecimalToString()
  amount!: string;

  @ApiProperty({
    example: 1,
    description: 'Balance Type: 1 for Cash, 2 for Coin',
  })
  @Expose()
  balanceType!: number;

  @ApiProperty({
    example: '2024-06-01T12:00:00Z',
    description: 'Transaction Creation Time',
  })
  @Expose()
  @DateToTimestamp()
  createdAt!: number;

  @ApiPropertyOptional({
    example: 'ord_654321',
    description: 'Related Order ID',
  })
  @Expose()
  relatedId?: string;

  @ApiPropertyOptional({
    example: 'Payment for order ord_654321',
    description: 'Transaction Description',
  })
  @Expose()
  description?: string;
}
