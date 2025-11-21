import {ApiProperty} from "@nestjs/swagger";

export class CheckoutResponseDto {
    @ApiProperty({ description: 'Order Id', example: '1', type: String})
    order_id!: string;
    @ApiProperty({ description: 'Order Number', example: 'ORD123456789', type: String})
    order_no!: string;
    @ApiProperty({ description: 'Group ID if applicable', example: 'groupId123', type: String, required: false})
    group_id?: string;
    @ApiProperty({ description: 'List of lottery ticket numbers purchased', example: ['LT123456', 'LT123457'], type: [String]})
    lottery_tickets!: string[];
    @ApiProperty({ description: 'Amount of activity coins used', example: 0, type: Number})
    activity_coin!: number;
}