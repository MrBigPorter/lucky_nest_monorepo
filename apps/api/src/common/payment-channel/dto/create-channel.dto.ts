import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsNumber,
  IsUrl,
  Min,
  Max,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
} from 'class-validator';
import { ToInt, ToNumber } from '@api/common/dto/transforms';

export class CreateChannelDto {
  @ApiProperty({ description: '渠道编码 (Xendit Code)', example: 'PH_GCASH' })
  @IsNotEmpty()
  @IsString()
  code!: string;

  @ApiProperty({ description: '显示名称', example: 'GCash' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ description: '图标URL', example: 'https://cdn.com/gcash.png' })
  @IsNotEmpty()
  @IsUrl()
  icon!: string;

  @ApiProperty({ description: '类型: 1-充值 2-提现', example: 1 })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @IsIn([1, 2])
  type!: number;

  @ApiProperty({ description: '最小金额', example: 100 })
  @IsNotEmpty()
  @ToNumber()
  @IsNumber()
  @Min(0)
  minAmount!: number;

  @ApiProperty({ description: '最大金额', example: 50000 })
  @IsNotEmpty()
  @ToNumber()
  @IsNumber()
  @Min(0)
  maxAmount!: number;

  @ApiProperty({
    description: '固定金额选项 (充值用)',
    example: [100, 200, 500],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  fixedAmounts?: number[];

  @ApiProperty({ description: '固定手续费', example: 0, required: false })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  feeFixed?: number;

  @ApiProperty({ description: '费率 (0.01 = 1%)', example: 0, required: false })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  @Max(1)
  feeRate?: number;

  @ApiProperty({ description: '排序权重', example: 0 })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  sortOrder!: number;

  @ApiProperty({ description: '是否启用', example: 1 })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @IsIn([0, 1, 2]) // 0-禁用 1-启用 2-维护
  status!: number;
}
