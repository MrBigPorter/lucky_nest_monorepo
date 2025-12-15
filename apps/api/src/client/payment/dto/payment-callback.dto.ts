import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class PaymentCallbackDto {
  @ApiProperty({ description: 'Order Number', example: 'order_12345' })
  @IsNotEmpty()
  @IsString()
  orderNo!: string;

  @ApiProperty({ description: 'Transaction ID', example: 'txn_67890' })
  @IsNotEmpty()
  @IsString()
  transactionId!: string;

  @ApiProperty({ description: 'Payment Status', example: 'SUCCESS' })
  @IsNotEmpty()
  @IsString()
  status!: string;

  @ApiProperty({ description: 'Payment Amount', example: '100.50' })
  @IsNotEmpty()
  @IsNumberString()
  amount!: string;

  @ApiProperty({ description: 'Signature', example: 'abcdef123456' })
  @IsNotEmpty()
  @IsString()
  signature!: string;

  @ApiPropertyOptional({
    description: 'Additional Data',
    example: '{}',
    required: false,
  })
  @IsOptional()
  @IsString()
  paidA?: string;

  @ApiPropertyOptional({
    description: 'Metadata',
    example: '{}',
    required: false,
  })
  @ApiPropertyOptional({ description: 'Metadata', example: { key: 'value' } })
  @IsOptional()
  metadata?: any;
}
