import { PaginatedResponseDto } from '@api/common/dto/paginated-response.dto';
import { WithdrawalItemResponseDto } from '@api/client/wallet/dto/withdrawal-item-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class WithdrawalHistoryResponseDto extends PaginatedResponseDto<WithdrawalItemResponseDto> {
  @ApiProperty({ type: [WithdrawalItemResponseDto] })
  override list!: WithdrawalItemResponseDto[];
}
