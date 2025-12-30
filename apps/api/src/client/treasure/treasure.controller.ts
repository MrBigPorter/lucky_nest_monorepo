import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Query,
  UseInterceptors,
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
} from '@api/client/treasure/dto/treasure-response-dto';
import { plainToInstance } from 'class-transformer';

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
}
