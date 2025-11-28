import {OrderItemDto, WalletTransactionDto} from "@api/orders/dto/order-item.dto";
import { ApiProperty } from "@nestjs/swagger";

/**
 * Order detail response DTO extending OrderItemDto and including wallet transactions.
 */
export class OrderDetailResponseDto extends OrderItemDto{
    @ApiProperty({ description: 'wallet transactions', type: [WalletTransactionDto]})
    transactions!: WalletTransactionDto[];
}