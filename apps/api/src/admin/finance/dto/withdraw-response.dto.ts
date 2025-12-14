import { Exclude, Expose, Type } from 'class-transformer';
import { DateToTimestamp, DecimalToString } from '@api/common/dto/transforms';

@Exclude()
class UserSimpleDto {
  @Expose()
  nickname!: string;

  @Expose()
  phone!: string;
}

@Exclude()
export class WithdrawResponseDto {
  @Expose()
  withdrawId!: string;

  @Expose()
  withdrawNo!: string;

  @Expose()
  userId!: string;

  @Expose()
  @DecimalToString()
  withdrawAmount!: string;

  @Expose()
  @DecimalToString()
  feeAmount!: string;

  @Expose()
  @DecimalToString()
  actualAmount!: string;

  @Expose()
  withdrawMethod!: string;

  @Expose()
  withdrawAccount!: string;

  @Expose()
  accountName!: string;

  @Expose()
  withdrawStatus!: number;

  @Expose()
  auditRemark!: string;

  @Expose()
  rejectReason?: string;

  @Expose()
  @DateToTimestamp()
  appliedAt!: number;

  @Expose()
  @DateToTimestamp()
  completedAt?: number;

  @Expose()
  @Type(() => UserSimpleDto)
  user?: UserSimpleDto;
}
