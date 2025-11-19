import {ApiProperty} from "@nestjs/swagger";
import {IsNotEmpty, IsNumber, IsOptional, IsString} from "class-validator";
import {ToNumber} from "@api/common/dto/transforms";

export class CreditDto {

    @ApiProperty({ description: 'Amount to credit', example: 100.50 })
    @ToNumber()
    @IsNumber()
    @IsNotEmpty()
    amount!: number

    @ApiProperty({ description: 'Related entity ID', example: 'order_12345', required: false })
    @IsOptional()
    @IsString()
    relatedId?: string;

    @ApiProperty({ description: 'Related entity type', example: 'ORDER', required: false })
    @IsOptional()
    @IsString()
    relatedType?: string;

    @ApiProperty({ description: 'Description of the credit', example: 'Credit for order #12345', required: false })
    @IsOptional()
    @IsString()
    desc?: string;
}