import { GroupForTreasureItemDto } from './group-for-treasure-item.dto';

export class GroupListForTreasureResponseDto {
  page!: number;
  pageSize!: number;
  total!: number;
  list!: GroupForTreasureItemDto[];
}
