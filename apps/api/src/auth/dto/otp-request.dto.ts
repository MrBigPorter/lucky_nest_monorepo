import {IsInt, IsOptional, IsString, MaxLength, Min} from "class-validator";

export  class OtpRequestDto {
   @IsString() @MaxLength(20)
    phone!: string;
   
   @IsInt() @IsOptional() @Min(1)
    countryCode?: number;
 }