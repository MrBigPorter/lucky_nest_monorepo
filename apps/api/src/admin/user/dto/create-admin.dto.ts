import { Role } from '@lucky/shared';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminDto {
  @ApiProperty({ description: 'username', example: 'admin', type: 'string' })
  @IsNotEmpty()
  @IsString()
  @Length(4, 20)
  username!: string;

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
  @IsNotEmpty()
  @IsEnum(Role)
  role!: Role;
}
