import { PaginatedResponseDto } from '@api/common/dto/paginated-response.dto';
import { TreasureResponseDto } from '@api/admin/treasure/dto/treasure-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class TreasureListResponseDto extends PaginatedResponseDto<TreasureResponseDto> {
  @ApiProperty({
    description: 'list of treasures',
    type: [TreasureResponseDto],
  })
  override list!: TreasureResponseDto[];
}
