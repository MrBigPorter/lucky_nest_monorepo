import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ApiAcceptedResponse, ApiProperty } from '@nestjs/swagger';
import { ToNumber } from '@api/common/dto/transforms';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class LoginOtpDto {
  @ApiProperty({ example: '9878129723', description: 'phone number' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: 1, description: 'country code', required: false })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  countryCode?: number;

  @ApiProperty({ example: 123456, description: 'invite code', required: false })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  inviteCode?: number;
}
