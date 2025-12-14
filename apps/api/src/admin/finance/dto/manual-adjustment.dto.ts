import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ToInt, ToNumber } from '@api/common/dto/transforms';
import { Type } from 'class-transformer';

export class ManualAdjustmentDto {
  @ApiProperty({ description: 'User ID', example: 'user_12345' })
  @IsNotEmpty()
  @IsString()
  userId!: string;

  @ApiProperty({ description: 'Action Type', example: 1 })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @IsIn([1, 2]) // Example: 1 for credit, 2 for debit
  actionType!: number;

  @ApiProperty({ description: 'Balance Type', example: 1 })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @IsIn([1, 2, 3]) // Example: 1 for main balance, 2 for coin balance, 3 for locked balance
  balanceType!: number;

  @ApiProperty({ description: 'Amount', example: 100 })
  @IsNotEmpty()
  @Type(() => Number)
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Amount must be a positive number with up to two decimal places',
  })
  amount!: number;

  @ApiProperty({
    description: 'Remark',
    example: 'Manual adjustment for user request',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  remark!: string;
}
