import { IsString, Length } from 'class-validator';

export class OtpRequestDto {
  @IsString()
  phone!: string;
}

export class OtpVerifyDto {
  @IsString()
  phone!: string;

  @IsString()
  @Length(4, 8) // 6 位为主，这里放宽到 4~8 方便你以后调整
  code!: string;
}
