import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class SendEmailCodeDto {
  @ApiProperty({ example: 'demo@example.com', description: 'login email' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class EmailLoginDto {
  @ApiProperty({ example: 'demo@example.com', description: 'login email' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '123456', description: 'email otp code' })
  @IsString()
  @Length(4, 20)
  code!: string;
}

export class SendEmailCodeResponseDto {
  @ApiProperty({ example: true })
  sent!: boolean;

  @ApiPropertyOptional({
    example: '666666',
    description: 'only returned in non-production for local testing',
  })
  @IsOptional()
  @IsString()
  devCode?: string;
}
