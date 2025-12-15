import { PaginatedResponseDto } from '@api/common/dto/paginated-response.dto';
import { TransactionResponseDto } from '@api/client/wallet/dto/transaction-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class TransactionListResponseDto extends PaginatedResponseDto<TransactionResponseDto> {
  @ApiProperty({ type: [TransactionResponseDto] })
  override list!: TransactionResponseDto[];
}
