import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Exclude } from 'class-transformer';
import {
  DecimalToString,
  DateToTimestamp,
  MaskString,
} from '@api/common/dto/transforms'; // 假设您有这些工具

@Exclude()
export class WithdrawalItemResponseDto {
  @ApiProperty({ example: 'wd_123456', description: 'Withdrawal ID' })
  @Expose()
  withdrawNo!: string;

  @ApiProperty({ example: 'Bank Transfer', description: 'Withdrawal Method' })
  @Expose()
  @DecimalToString()
  amount!: string;

  @ApiProperty({ example: 'Bank Transfer', description: 'Withdrawal Method' })
  @Expose()
  @DecimalToString()
  withdrawAmount!: string;

  @ApiProperty({ example: 'Bank Transfer', description: 'Withdrawal Method' })
  @Expose()
  @DecimalToString()
  actualAmount!: string;

  @ApiProperty({ example: '100.00', description: 'Withdrawal Amount' })
  @Expose()
  @DecimalToString()
  feeAmount!: string;

  @ApiProperty({ description: 'withdrawStatus', example: 1 })
  @Expose()
  withdrawStatus!: number;

  @ApiProperty({
    example: '2024-06-01T12:00:00Z',
    description: 'Creation Time',
  })
  @Expose()
  @DateToTimestamp()
  createdAt!: number;

  @ApiPropertyOptional({
    example: '2024-06-02T12:00:00Z',
    description: 'Audit Time',
  })
  @Expose()
  @DateToTimestamp()
  auditedAt?: number;

  @ApiPropertyOptional({
    example: '2024-06-03T12:00:00Z',
    description: 'Completion Time',
  })
  @Expose()
  @DateToTimestamp()
  completedAt?: number;

  @ApiPropertyOptional({
    example: 'Insufficient funds',
    description: 'Rejection Reason',
  })
  @Expose()
  rejectReason?: string;

  @ApiProperty({ example: 'John Doe', description: 'Account Name' })
  @Expose()
  accountName!: string;

  @ApiProperty({
    example: '**** **** **** 1234',
    description: 'Masked Account Number',
  })
  @Expose()
  @MaskString('bankcard')
  withdrawAccount!: string;
}
