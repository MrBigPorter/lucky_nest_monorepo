import { ApiProperty } from '@nestjs/swagger';

export class WalletBalanceResponseDto {
  @ApiProperty({ example: 'wal_123456', description: 'Wallet ID' })
  id!: string;

  @ApiProperty({ example: 'user_123456', description: 'User ID' })
  user_id!: string;

  @ApiProperty({ example: '1000.00', description: 'Available cash balance' })
  real_balance!: string;

  @ApiProperty({ example: '1500.00', description: 'Total recharge amount' })
  total_recharge!: string;

  @ApiProperty({ example: '200.00', description: 'Coin balance' })
  coin_balance!: string;

  @ApiProperty({ example: '0.00', description: 'Frozen cash balance' })
  frozen_balance!: string;

  @ApiProperty({ example: '0.00', description: 'Total withdraw amount' })
  total_withdraw!: string;
}
