import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Role } from '@lucky/shared';

export class UpdateAdminDto {
  @ApiProperty({ description: 'realName', example: 'admin', type: 'string' })
  @IsOptional()
  @IsString()
  realName?: string;

  @ApiProperty({ description: 'password', example: 'admin', type: 'string' })
  @IsOptional()
  @IsString()
  @Length(6, 32)
  password?: string;

  @ApiProperty({ description: 'role', example: 'ADMIN', type: 'string' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ description: 'status', example: 1, type: 'number' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  status?: number;
}
