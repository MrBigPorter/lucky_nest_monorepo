import {OrderItemDto} from "@api/orders/dto/order-item.dto";

export class ListOrdersResponseDto{
    page!: number;
    pageSize!: number
    total!: number;
    list!: OrderItemDto[];
}