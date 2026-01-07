import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ToNumber } from '@api/common/dto/transforms';

export class ApplyWithdrawDto {
  @ApiProperty({ description: 'Withdrawal amount', example: 150.75 })
  @IsNotEmpty()
  @IsNumber()
  @Min(100, { message: 'Minimum withdrawal amount is 100' })
  amount!: number;

  @ApiProperty({ description: 'Withdrawal account', example: '1234567890' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  account!: string;

  @ApiProperty({ description: 'Account holder name', example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  accountName!: string;

  @ApiProperty({ description: 'Payment channel ID', example: 2 })
  @IsNotEmpty()
  @ToNumber()
  @IsNumber()
  channelId!: number;

  @ApiProperty({
    description: 'Bank name (required if method is Bank)',
    example: 'Bank of Examples',
    required: false,
  })
  @IsOptional()
  @IsString()
  bankName?: string;
}
