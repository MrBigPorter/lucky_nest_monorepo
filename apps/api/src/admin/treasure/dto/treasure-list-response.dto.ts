import { PaginatedResponseDto } from '@api/common/dto/paginated-response.dto';
import { TreasureResponseClientDto } from '@api/admin/treasure/dto/treasure-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class TreasureListResponseClientDto extends PaginatedResponseDto<TreasureResponseClientDto> {
  @ApiProperty({
    description: 'list of treasures',
    type: [TreasureResponseClientDto],
  })
  override list!: TreasureResponseClientDto[];
}
