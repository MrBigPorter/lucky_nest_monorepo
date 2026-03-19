import { ApiProperty } from '@nestjs/swagger';
import { LoginResultResponseDto } from './login.dto';

export class OauthLoginResponseDto extends LoginResultResponseDto {
  @ApiProperty({ example: 'google', description: 'oauth provider' })
  provider!: string;
}
