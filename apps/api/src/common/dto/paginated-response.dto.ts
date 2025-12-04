import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for paginated responses.
 * @param T - The type of the items in the paginated list.
 * - page: Current page number.
 * - pageSize: Number of items per page.
 * - total: Total number of items.
 * - list: Array of items of type T.
 */
export class PaginatedResponseDto<T> {
  @ApiProperty()
  page!: number;
  @ApiProperty()
  pageSize!: number;
  @ApiProperty()
  total!: number;
  @ApiProperty({ isArray: true })
  list!: T[];
}
