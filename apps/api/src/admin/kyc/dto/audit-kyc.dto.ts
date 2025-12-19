import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AuditKycDto {
  @ApiProperty({
    description: 'action: approve/reject/need_more',
    example: 'approve',
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['approve', 'reject', 'need_more'])
  action!: 'approve' | 'reject' | 'need_more';

  @ApiProperty({
    description: 'remark (max 500 characters)',
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  remark!: string;
}
