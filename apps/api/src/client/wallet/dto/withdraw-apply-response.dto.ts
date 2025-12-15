import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { DecimalToString } from '@api/common/dto/transforms';

@Exclude()
export class WithdrawApplyResponseDto {
  @ApiProperty({ description: 'Withdrawal ID', example: 'withdraw_12345' })
  @Expose()
  withdrawId!: string;

  @ApiProperty({ description: 'Withdrawal Number', example: 'WD202406010001' })
  @Expose()
  withdrawNo!: string;

  @ApiProperty({ description: ' Withdrawal Amount', example: '150.75' })
  @Expose()
  @DecimalToString()
  withdrawAmount!: string;

  @ApiProperty({ description: 'Withdrawal Status', example: 1 })
  @Expose()
  withdrawStatus!: number;
}
