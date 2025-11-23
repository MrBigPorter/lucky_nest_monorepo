import { GroupForTreasureItemDto } from './group-for-treasure-item.dto';

export class GroupListForTreasureResultDto {
    page!: number;
    pageSize!: number;
    total!: number;
    list!: GroupForTreasureItemDto[];
}