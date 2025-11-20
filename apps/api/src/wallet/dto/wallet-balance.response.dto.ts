import { ApiProperty } from '@nestjs/swagger';

export class WalletBalanceResponseDto {
    @ApiProperty({ example: 'wal_123456', description: 'Wallet ID' })
    id!: string;

    @ApiProperty({ example: 'user_123456', description: 'User ID' })
    userId!: string;

    @ApiProperty({ example: '1000.00', description: 'Available cash balance' })
    realBalance!: string;

    @ApiProperty({ example: '1500.00', description: 'Total recharge amount' })
    totalRecharge!: string;

    @ApiProperty({ example: '200.00', description: 'Coin balance' })
    coinBalance!: string;

    @ApiProperty({ example: '0.00', description: 'Frozen cash balance' })
    frozenBalance!: string;

    @ApiProperty({ example: '0.00', description: 'Total withdraw amount' })
    totalWithdraw!: string;
}