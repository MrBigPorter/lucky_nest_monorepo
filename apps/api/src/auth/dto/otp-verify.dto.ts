import {IsNotEmpty, IsNumberString, IsString, Length} from "class-validator";
import {Transform} from "class-transformer";

export class OtpVerifyDto {
    @Transform(({value}) => String(value ?? '').trim())
    @IsNotEmpty()
    @IsNumberString()
    @Length(4,20)
    phone!: string;

    @IsString()
    @Length(4, 8)
    @Transform(({value}) => String(value ?? '').trim())
    code!: string;
}