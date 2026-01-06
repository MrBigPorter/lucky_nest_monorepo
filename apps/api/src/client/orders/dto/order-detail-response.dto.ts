import {
  OrderItemDto,
  WalletTransactionDto,
} from '@api/client/orders/dto/order-item.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Order detail response DTO extending OrderItemDto and including wallet transactions.
 */
/*export class OrderDetailResponseDto extends OrderItemDto {
  @ApiProperty({
    description: 'wallet transactions',
    type: [WalletTransactionDto],
  })
  //  核心魔法：告诉框架，这个数组里的东西，要用 WalletTransactionDto 的规则去洗
  @Type(() => WalletTransactionDto)
  transactions!: WalletTransactionDto[];
}*/

export class OrderDetailResponseDto extends OrderItemDto {
  @ApiProperty({
    description: 'wallet transactions',
    type: [WalletTransactionDto],
  })
  //  核心魔法：告诉框架，这个数组里的东西，要用 WalletTransactionDto 的规则去洗
  @Type(() => WalletTransactionDto)
  transactions!: WalletTransactionDto[];
}
