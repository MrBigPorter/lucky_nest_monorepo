import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TreasureService } from '@api/client/treasure/treasure.service';
import { TreasureQueryDto } from '@api/client/treasure/dto/treasure-query.dto';
import { throwBiz } from '@api/common/exceptions/biz.exception';
import { ERROR_KEYS } from '@api/common/error-codes.gen';
import { ApiOkResponse } from '@nestjs/swagger';
import {
  TreasureListResponseDto,
  TreasureResponseDto,
  TreasureStatusDto,
} from '@api/client/treasure/dto/treasure-response-dto';
import { plainToInstance } from 'class-transformer';
import { HotGroupItemDto } from '@api/client/treasure/dto/hot_croup_item.dto';
import { CurrentUserId } from '@api/common/decorators/user.decorator';
import { OptionalJwtAuthGuard } from '@api/common/jwt/option-jwt.guard';

@Controller('treasure')
export class TreasureController {
  constructor(private readonly svc: TreasureService) {}

  /**
   * 商品列表
   * @returns Promise<{ list: TreasureListResponseDto[], page: number, pageSize: number, total: number }>
   */
  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOkResponse({ type: TreasureListResponseDto })
  async list(@Query() dto: TreasureQueryDto) {
    const data = await this.svc.list(dto);
    return {
      ...data,
      list: plainToInstance(TreasureResponseDto, data.list),
    };
  }

  /**
   * 热门团列表
   * @param userId
   * @param limit
   */
  @Get('hot-groups')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOkResponse({ type: [HotGroupItemDto] })
  async getHotGroups(
    @CurrentUserId() userId?: string,
    @Query('limit') limit?: number,
  ) {
    // 限制最大查询数量，防止前端传个 10000 把数据库搞挂
    const take = Math.min(Number(limit) || 10, 20);
    const list = await this.svc.getHotGroups(take, userId);

    return plainToInstance(HotGroupItemDto, list);
  }

  /**
   * 商品详情
   * @param id
   */
  @Get(':id')
  @ApiOkResponse({ type: TreasureResponseDto })
  async detail(@Param('id') id: string) {
    const item = await this.svc.detail(id);
    if (!item) throwBiz(ERROR_KEYS.NOT_FOUND);
    return plainToInstance(TreasureResponseDto, item);
  }

  /**
   * 商品状态
   * @param id
   */
  @Get('status/:id')
  @ApiOkResponse({ type: TreasureStatusDto })
  async getStatus(@Param('id') id: string) {
    const status = await this.svc.getStatus(id);
    if (status === null) throwBiz(ERROR_KEYS.NOT_FOUND);
    return plainToInstance(TreasureStatusDto, status);
  }
}
