import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DateToTimestamp, DecimalToString } from '@api/common/dto/transforms';
import { PaginatedResponseDto } from '@api/common/dto/paginated-response.dto';

export class GetRechargeHistoryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageSize?: number = 10;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  status?: number; // 对应 rechargeStatus: 1-待支付, 2-支付中...
}

export class RechargeHistoryItemDto {
  @ApiProperty({ description: '充值订单号', example: 'RO123456789' })
  rechargeNo!: string;

  @ApiProperty({ description: '充值金额 (字符串格式)', example: '100.00' })
  @DecimalToString()
  rechargeAmount!: string;

  @ApiProperty({ description: '实际到账金额 (字符串格式)', example: '100.00' })
  @DecimalToString()
  actualAmount!: string;

  @ApiProperty({
    description: '充值状态: 1-待支付 2-支付中 3-充值成功 4-充值失败 5-已取消',
    example: 1,
  })
  rechargeStatus!: number;

  @ApiProperty({
    description: '支付方式: 1-GCash 2-PayMaya 3-Bank 4-Card',
    example: 1,
  })
  paymentMethod!: number;

  @ApiProperty({ description: '创建时间 (毫秒时间戳)', example: 1704067200000 })
  @DateToTimestamp()
  createdAt!: number;

  @ApiProperty({
    description: '支付时间 (毫秒时间戳), 未支付为 null',
    required: false,
    example: null,
  })
  @DateToTimestamp()
  paidAt!: number;
}

export class RechargeHistoryResponseDto extends PaginatedResponseDto<RechargeHistoryItemDto> {
  @ApiProperty({ description: '列表数据', type: [RechargeHistoryItemDto] })
  @Type(() => RechargeHistoryItemDto)
  list!: RechargeHistoryItemDto[];
}
