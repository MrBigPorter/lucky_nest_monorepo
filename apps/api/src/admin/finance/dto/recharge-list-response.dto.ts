import { PaginatedResponseDto } from '@api/common/dto/paginated-response.dto';
import { RechargeResponseDto } from '@api/admin/finance/dto/recharge-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class RechargeListResponseDto extends PaginatedResponseDto<RechargeResponseDto> {
  @ApiProperty({ type: [RechargeResponseDto] })
  override list!: RechargeResponseDto[];
}
