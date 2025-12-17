import { ApiProperty } from '@nestjs/swagger';

export class QueryStatisticsDto {
  @ApiProperty({ description: 'Total Deposit', example: '1000.00' })
  pendingWithdraw!: string;

  @ApiProperty({ description: 'Total Withdraw', example: '500.00' })
  totalDeposit!: string;

  @ApiProperty({ description: 'Total Withdraw', example: '300.00' })
  totalWithdraw!: string;

  @ApiProperty({ description: 'Deposit Trend', example: 'upward' })
  depositTrend!: string;

  @ApiProperty({ description: 'Withdraw Trend', example: 'downward' })
  withdrawTrend!: string;
}
