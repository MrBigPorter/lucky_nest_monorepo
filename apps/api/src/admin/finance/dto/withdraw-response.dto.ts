import { Exclude, Expose, Type } from 'class-transformer';
import { DateToTimestamp, DecimalToString } from '@api/common/dto/transforms';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
class UserSimpleDto {
  @ApiProperty({ description: 'User ID', example: 'user_12345' })
  @Expose()
  nickname!: string;

  @ApiProperty({ description: 'User Nickname', example: 'john_doe' })
  @Expose()
  phone!: string;
}

@Exclude()
export class WithdrawResponseDto {
  @ApiProperty({ description: 'Withdrawal ID', example: 'withdraw_12345' })
  @Expose()
  withdrawId!: string;

  @ApiProperty({ description: 'Withdrawal Number', example: 'WD202406010001' })
  @Expose()
  withdrawNo!: string;

  @ApiProperty({ description: 'User ID', example: 'user_12345' })
  @Expose()
  userId!: string;

  @ApiProperty({ description: ' Withdrawal Amount', example: '150.75' })
  @Expose()
  @DecimalToString()
  withdrawAmount!: string;

  @ApiProperty({ description: 'Fee Amount', example: '2.50' })
  @Expose()
  @DecimalToString()
  feeAmount!: string;

  @ApiProperty({ description: 'Actual Amount', example: '148.25' })
  @Expose()
  @DecimalToString()
  actualAmount!: string;

  @ApiProperty({
    description: 'withdraw method: GCash, PayMaya, Bank Transfer',
    example: 'Bank Transfer',
  })
  @Expose()
  withdrawMethod!: string;

  @ApiProperty({ description: 'Withdrawal Account', example: '1234567890' })
  @Expose()
  withdrawAccount!: string;

  @ApiProperty({ description: 'Account Holder Name', example: 'John Doe' })
  @Expose()
  accountName!: string;

  @ApiProperty({
    description:
      'withdraw status: PENDING_AUDIT: 1,APPROVED: 2,PROCESSING: 3,SUCCESS: 4,REJECTED: 5,FAILED: 6',
    example: 1,
  })
  @Expose()
  withdrawStatus!: number;

  @ApiProperty({ description: 'Reject Reason', example: 'Insufficient funds' })
  @Expose()
  rejectReason?: string;

  @ApiProperty({ description: 'Applied At', example: 1622547800 })
  @Expose()
  @DateToTimestamp()
  appliedAt!: number;

  @ApiProperty({ description: 'Completed At', example: 1622634200 })
  @Expose()
  @DateToTimestamp()
  completedAt?: number;

  @ApiProperty({ description: 'Remark', example: 'User requested withdrawal' })
  @Expose()
  remark!: string;

  @ApiProperty({ description: 'User Information' })
  @Expose()
  @Type(() => UserSimpleDto)
  user?: UserSimpleDto;
}
