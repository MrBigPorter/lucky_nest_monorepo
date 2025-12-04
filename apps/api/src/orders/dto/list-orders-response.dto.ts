import { OrderItemDto } from '@api/orders/dto/order-item.dto';
import { PaginatedResponseDto } from '@api/common/dto/paginated-response.dto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for the response of listing orders, extending a paginated response.
 */
export class ListOrdersResponseDto extends PaginatedResponseDto<OrderItemDto> {
  @ApiProperty({ description: 'list of orders', type: [OrderItemDto] })
  override list!: OrderItemDto[];
}
