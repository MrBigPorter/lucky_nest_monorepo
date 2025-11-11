import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
    @IsString() @IsNotEmpty()
    phone!: string;

    @IsString() @MinLength(6)
    password!: string;
}

export  class LoginOtpDto {
    @IsString() @IsNotEmpty()
    phone!: string;
}