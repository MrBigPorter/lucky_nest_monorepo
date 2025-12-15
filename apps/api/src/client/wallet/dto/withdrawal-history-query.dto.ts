import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsIn, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { WITHDRAW_STATUS } from '@lucky/shared';
import { ToInt } from '@api/common/dto/transforms';

export class WithdrawalHistoryQueryDto {
  @ApiProperty({ description: 'page', example: 1, type: Number })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  page!: number;

  @ApiProperty({ description: 'pageSize', example: 10, type: Number })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize!: number;

  @ApiPropertyOptional({
    description: 'Withdrawal Status Filter',
    example: WITHDRAW_STATUS.SUCCESS,
    type: Number,
  })
  @IsOptional()
  @ToInt()
  @IsInt()
  @IsIn([1, 2, 3])
  status?: number;
}
