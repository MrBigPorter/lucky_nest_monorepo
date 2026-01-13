import { PaginatedResponseDto } from '@api/common/dto/paginated-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { AdminTreasureResponseDto } from '@api/admin/treasure/dto/treasure-response.dto';

export class TreasureListResponseDto extends PaginatedResponseDto<AdminTreasureResponseDto> {
  @ApiProperty({
    description: 'list of treasures',
    type: [AdminTreasureResponseDto],
  })
  override list!: AdminTreasureResponseDto[];
}
