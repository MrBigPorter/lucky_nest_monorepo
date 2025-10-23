import {IsInt, IsNotEmpty, IsNumberString, IsOptional, Length, Min} from "class-validator";
import {Transform} from "class-transformer";

export class OtpRequestDto {
    @Transform(({value}) => String(value ?? '').trim())
    @IsNotEmpty()
    @IsNumberString()
    @Length(4,20)
    phone!: string;

    @IsInt()
    @IsOptional()
    @Transform(({value}) =>value === undefined ? undefined: Number(value ?? 86))
    countryCode?: number;
}