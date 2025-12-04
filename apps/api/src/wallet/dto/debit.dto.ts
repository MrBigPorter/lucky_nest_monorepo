import { ApiProperty } from '@nestjs/swagger';
import { ToNumber } from '@api/common/dto/transforms';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class DebitDto {
  @ApiProperty({ description: 'Amount to debit', example: 50.25 })
  @ToNumber()
  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @ApiProperty({
    description: 'Related entity ID',
    example: 'order_12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  relatedId?: string;

  @ApiProperty({
    description: 'Related entity type',
    example: 'ORDER',
    required: false,
  })
  @IsOptional()
  @IsString()
  relatedType?: string;

  @ApiProperty({
    description: 'Description of the debit',
    example: 'Debit for order #12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  desc?: string;
}
