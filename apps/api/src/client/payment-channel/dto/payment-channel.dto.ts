import { ApiProperty } from '@nestjs/swagger';
import { DecimalToString } from '@api/common/dto/transforms';
import { Type } from 'class-transformer';

export class PaymentConfigItemDto {
  @ApiProperty({ description: '渠道ID (下单传此ID)', example: 1 })
  id!: number;

  @ApiProperty({
    description: '渠道编码 (前端做UI逻辑可能用到)',
    example: 'PH_GCASH',
  })
  code!: string;

  @ApiProperty({ description: '渠道名称', example: 'GCash' })
  name!: string;

  @ApiProperty({
    description: '图标',
    example: 'https://cdn.com/icons/gcash.png',
  })
  icon!: string;

  @ApiProperty({ description: '单笔最小限额', example: 50 })
  @DecimalToString()
  minAmount!: string;

  @ApiProperty({ description: '单笔最大限额', example: 50000 })
  @DecimalToString()
  maxAmount!: number;

  @ApiProperty({
    description: '快捷金额卡片 (仅充值有效)',
    example: [100, 200, 500],
    type: [Number],
  })
  options!: number[];

  @ApiProperty({
    description: '用户需要支付的手续费 (仅提现有效)',
    example: 15,
  })
  fee!: number;

  @ApiProperty({ description: '是否允许输入自定义金额', example: true })
  isCustom!: boolean;
}

export class PaymentConfigResponseDto {
  @ApiProperty({ description: '可用渠道列表', type: [PaymentConfigItemDto] })
  @Type(() => PaymentConfigItemDto)
  channels!: PaymentConfigItemDto[];
}
