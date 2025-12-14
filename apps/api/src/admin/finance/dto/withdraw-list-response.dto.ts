import { PaginatedResponseDto } from '@api/common/dto/paginated-response.dto';
import { WithdrawResponseDto } from '@api/admin/finance/dto/withdraw-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class WithdrawListResponseDto extends PaginatedResponseDto<WithdrawResponseDto> {
  @ApiProperty({ type: [WithdrawResponseDto] })
  override list!: WithdrawResponseDto[];
}
