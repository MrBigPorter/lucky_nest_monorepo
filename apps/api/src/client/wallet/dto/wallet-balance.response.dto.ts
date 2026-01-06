import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { DecimalToString } from '@api/common/dto/transforms';

@Exclude()
export class WalletBalanceResponseDto {
  @ApiProperty({ example: 'wal_123456', description: 'Wallet ID' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'user_123456', description: 'User ID' })
  @Expose()
  userId!: string;

  @ApiProperty({ example: '1000.00', description: 'Available cash balance' })
  @Expose()
  @DecimalToString()
  realBalance!: string;

  @ApiProperty({ example: '1500.00', description: 'Total recharge amount' })
  @Expose()
  @DecimalToString()
  totalRecharge!: string;

  @ApiProperty({ example: '200.00', description: 'Coin balance' })
  @Expose()
  @DecimalToString()
  coinBalance!: string;

  @ApiProperty({ example: '0.00', description: 'Frozen cash balance' })
  @Expose()
  @DecimalToString()
  frozenBalance!: string;

  @ApiProperty({ example: '0.00', description: 'Total withdraw amount' })
  @Expose()
  @DecimalToString()
  totalWithdraw!: string;
}
