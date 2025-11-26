import {IsNotEmpty, IsString} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class OrderDetailDto {

    @ApiProperty({ description: 'Order ID', example: 'orderId123', type: String})
    @IsNotEmpty()
    @IsString()
    orderId!: string;
}