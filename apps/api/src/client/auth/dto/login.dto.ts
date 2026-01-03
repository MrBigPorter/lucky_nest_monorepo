import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsNumber,
  Length,
} from 'class-validator';
import {
  ApiAcceptedResponse,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsSmartPhone, ToNumber } from '@api/common/dto/transforms';
import { TokenResponseDto } from '@api/client/auth/dto/token-response.dto';
import { UserProfileResponseDto } from '@api/client/auth/dto/user-profile.response.dto';

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
  @IsNotEmpty()
  @IsSmartPhone()
  phone!: string;

  @ApiProperty({ example: 1, description: 'country code', required: false })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  countryCode?: number;

  @ApiProperty({ example: '123456', description: 'OTP code' })
  @IsOptional()
  @IsString()
  @Length(4, 20)
  inviteCode?: number;
}

/**
 * 登录/注册 聚合响应结果
 * 包含 Tokens 和 UserInfo
 */
export class LoginResultResponseDto extends UserProfileResponseDto {
  @ApiProperty({ type: TokenResponseDto })
  tokens!: TokenResponseDto;
}
