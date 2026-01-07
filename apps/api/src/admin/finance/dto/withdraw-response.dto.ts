import { Exclude, Expose, Type } from 'class-transformer';
import { DateToTimestamp, DecimalToString } from '@api/common/dto/transforms';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Exclude()
class UserSimpleDto {
  @ApiProperty({ description: 'User ID', example: 'user_12345' })
  @Expose()
  id!: string; // 最好加上 ID，方便点击跳转用户详情

  @ApiProperty({ description: 'User Nickname', example: 'john_doe' })
  @Expose()
  nickname!: string;

  @ApiProperty({ description: 'User Phone', example: '09171234567' })
  @Expose()
  phone!: string;

  @ApiPropertyOptional({ description: 'User Avatar' })
  @Expose()
  avatar?: string; // 管理员看头像有助于辅助判断是否是真人
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

  // --- 金额部分 ---
  @ApiProperty({
    description: 'Withdrawal Amount (申请金额)',
    example: '150.75',
  })
  @Expose()
  @DecimalToString()
  withdrawAmount!: string;

  @ApiProperty({ description: 'Fee Amount (手续费)', example: '2.50' })
  @Expose()
  @DecimalToString()
  feeAmount!: string;

  @ApiProperty({ description: 'Actual Amount (实付金额)', example: '148.25' })
  @Expose()
  @DecimalToString()
  actualAmount!: string;

  // --- 渠道与账户部分 (核心缺失) ---
  @ApiProperty({
    description: 'Withdraw Method Enum (1:E-Wallet, 2:Bank)',
    example: 1,
  })
  @Expose()
  withdrawMethod!: number; // 建议对应数据库的 Int 类型

  @ApiProperty({ description: 'Bank/Channel Name', example: 'GCash' })
  @Expose()
  bankName?: string; // 🔥 新增：管理员需要看到是 GCash 还是 BPI

  @ApiProperty({ description: 'Channel Code', example: 'PH_GCASH' })
  @Expose()
  channelCode?: string; // 🔥 新增：用于显示图标或排查问题

  @ApiProperty({ description: 'Withdrawal Account', example: '1234567890' })
  @Expose()
  withdrawAccount!: string;

  @ApiProperty({ description: 'Account Holder Name', example: 'John Doe' })
  @Expose()
  accountName!: string;

  // --- 状态与审核部分 ---
  @ApiProperty({
    description:
      'Status: 1-Pending, 2-Approved, 3-Processing, 4-Success, 5-Rejected, 6-Failed',
    example: 1,
  })
  @Expose()
  withdrawStatus!: number;

  @ApiProperty({ description: 'Reject Reason', example: 'Insufficient funds' })
  @Expose()
  rejectReason?: string;

  @ApiProperty({
    description: 'Audit Result / Internal Remark',
    example: 'Verified manually',
  })
  @Expose()
  auditResult?: string;

  @ApiProperty({
    description: 'Auditor ID (Who audited this?)',
    example: 'admin_001',
  })
  @Expose()
  auditorId?: string; // 🔥 新增：责任到人

  // --- 三方信息 (对账用) ---
  @ApiProperty({
    description: 'Third Party Order No (Xendit ID)',
    example: 'disb_123...',
  })
  @Expose()
  thirdPartyOrderNo?: string; // 🔥 新增：出款失败去三方后台查单需要这个

  // --- 时间部分 ---
  @ApiProperty({ description: 'Applied At', example: 1622547800 })
  @Expose()
  @DateToTimestamp()
  appliedAt!: number;

  @ApiPropertyOptional({ description: 'Audited At', example: 1622550000 })
  @Expose()
  @DateToTimestamp()
  auditedAt?: number; // 🔥 新增：审核时间

  @ApiPropertyOptional({ description: 'Completed At', example: 1622634200 })
  @Expose()
  @DateToTimestamp()
  completedAt?: number;

  // --- 关联用户 ---
  @ApiProperty({ description: 'User Information' })
  @Expose()
  @Type(() => UserSimpleDto)
  user?: UserSimpleDto;
}
