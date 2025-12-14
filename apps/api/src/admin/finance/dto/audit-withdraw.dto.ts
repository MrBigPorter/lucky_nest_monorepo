import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ToInt } from '@api/common/dto/transforms';

export class AuditWithdrawDto {
  @ApiProperty({ description: 'Withdraw ID', example: 'withdraw_12345' })
  @IsNotEmpty()
  @IsString()
  withdrawId!: string;

  @ApiProperty({ description: 'Status (4-approve 5-reject)', example: 1 })
  @IsNotEmpty()
  @ToInt()
  @IsInt()
  @IsIn([4, 5])
  status!: number;

  @ApiProperty({
    description: 'Remark',
    example: 'Approved by admin',
    required: false,
  })
  @IsNotEmpty()
  @IsString()
  remark!: string;
}
