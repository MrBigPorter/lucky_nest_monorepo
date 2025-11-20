import {IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min} from "class-validator";
import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {ToNumber} from "@api/common/dto/transforms";

export class CheckoutDto {
    @ApiPropertyOptional({description: 'Group ID for group purchase', example: 'groupId123', type: String})
    @IsString()
    @IsNotEmpty()
    treasureId!: string;

    @ApiProperty({description: 'Number of entries to purchase', example: 1, type: Number})
    @IsNotEmpty()
    @ToNumber()
    @IsInt()
    @Min(1)
    entries!: number;
    @ApiPropertyOptional({description: 'Group ID if joining a group purchase', example: 'groupId123', type: String})
    @IsString()
    @IsOptional()
    groupId?: string;

    @ApiPropertyOptional({description: 'Coupon ID to apply', example: 'couponId123', type: String})
    @IsString()
    @IsOptional()
    couponId?: string;

    @ApiProperty({description: 'Payment method: 1 for cash, 2 for points', example: 1, type: Number})
    @IsNotEmpty()
    @ToNumber()
    @IsInt()
    paymentMethod!: number // 1 cash 2 points

    @ApiPropertyOptional({description: 'Shipping address ID', example: 'addressId123', type: String})
    @IsString()
    @IsOptional()
    addressId?: string;
}