import { Controller, Get, Query } from '@nestjs/common';
import { GroupService } from '@api/common/group/group.service';
import { GroupListForTreasureDto } from '@api/common/group/dto/group-list-for-treasure.dto';
import { GROUP_STATUS } from '@lucky/shared/dist/types/treasure';
import { ApiOkResponse } from '@nestjs/swagger';
import { GroupListForTreasureResponseDto } from '@api/common/group/dto/group-list-for-treasure-response.dto';
import { plainToInstance } from 'class-transformer';
import { GroupForTreasureItemDto } from '@api/common/group/dto/group-for-treasure-item.dto';

@Controller('groups')
export class GroupClientController {
  constructor(private readonly groupService: GroupService) {}

  /**
   * 商品团列表（App 专用，只看进行中、且没过期的团）
   * @param query
   */
  @Get('list')
  @ApiOkResponse({ type: GroupListForTreasureResponseDto })
  async list(@Query() query: GroupListForTreasureDto) {
    //  强制设置：App 只能看进行中、且没过期的
    // 即使前端黑客传了 ?status=3，这里也会被覆盖成 1
    query.status = GROUP_STATUS.ACTIVE;
    query.includeExpired = false;

    const data = await this.groupService.listGroupForTreasure(query);
    return {
      ...data,
      list: plainToInstance(GroupForTreasureItemDto, data.list),
    };
  }
}
