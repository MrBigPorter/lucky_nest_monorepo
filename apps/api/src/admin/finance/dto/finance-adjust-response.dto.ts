import { Exclude, Expose } from 'class-transformer';
import { DecimalToString, DateToTimestamp } from '@api/common/dto/transforms';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class FinanceAdjustResponseDto {
  @ApiProperty({ description: 'realBalance', example: '1000' })
  @Expose()
  @DecimalToString()
  realBalance!: string;

  @ApiProperty({ description: 'coinBalance', example: '500' })
  @Expose()
  @DecimalToString()
  coinBalance!: string;

  @ApiProperty({ description: 'frozenBalance', example: '200' })
  @Expose()
  @DecimalToString()
  frozenBalance!: string;

  @ApiProperty({ description: 'totalRecharge', example: '1500' })
  @Expose()
  @DecimalToString()
  totalRecharge!: string;

  @ApiProperty({ description: 'totalWithdraw', example: '700' })
  @Expose()
  @DecimalToString()
  totalWithdraw!: string;

  @ApiProperty({ description: 'createdAt', example: '10044444' })
  @Expose()
  @DateToTimestamp()
  createdAt!: number;

  @ApiProperty({ description: 'updatedAt', example: '10044444' })
  @Expose()
  @DateToTimestamp()
  updatedAt!: number;
}
