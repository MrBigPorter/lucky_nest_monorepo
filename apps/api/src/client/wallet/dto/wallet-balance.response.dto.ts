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
  user_id!: string;

  @ApiProperty({ example: '1000.00', description: 'Available cash balance' })
  @Expose()
  @DecimalToString()
  real_balance!: string;

  @ApiProperty({ example: '1500.00', description: 'Total recharge amount' })
  @Expose()
  @DecimalToString()
  total_recharge!: string;

  @ApiProperty({ example: '200.00', description: 'Coin balance' })
  @Expose()
  @DecimalToString()
  coin_balance!: string;

  @ApiProperty({ example: '0.00', description: 'Frozen cash balance' })
  @Expose()
  @DecimalToString()
  frozen_balance!: string;

  @ApiProperty({ example: '0.00', description: 'Total withdraw amount' })
  @Expose()
  @DecimalToString()
  total_withdraw!: string;
}
