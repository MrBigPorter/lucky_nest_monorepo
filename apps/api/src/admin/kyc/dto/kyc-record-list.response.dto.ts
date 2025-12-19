import { PaginatedResponseDto } from '@api/common/dto/paginated-response.dto';
import { KycRecordResponseDto } from '@api/admin/kyc/dto/kyc-record.response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class KycRecordListResponseDto extends PaginatedResponseDto<KycRecordResponseDto> {
  @ApiProperty({ type: [KycRecordResponseDto] })
  override list!: KycRecordResponseDto[];
}
