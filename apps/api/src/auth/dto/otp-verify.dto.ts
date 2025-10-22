import {IsString, Length, MaxLength} from "class-validator";

export class OtpVerifyDto {
    @IsString() @MaxLength(20)
    phone!: string;

    @IsString() @Length(4, 8)
    code!: string;
}