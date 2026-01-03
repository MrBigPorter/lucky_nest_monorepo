import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { PermissionsGuard } from '@api/common/guards/permissions.guard';
import { TreasureService } from '@api/admin/treasure/treasure.service';
import { OpAction, OpModule, Role } from '@lucky/shared';
import { CreateTreasureDto } from '@api/admin/treasure/dto/create-treasure.dto';
import { QueryTreasureDto } from '@api/admin/treasure/dto/query-treasure.dto';
import { UpdateTreasureDto } from '@api/admin/treasure/dto/update-treasure.dto';
import { TreasureResponseClientDto } from '@api/admin/treasure/dto/treasure-response.dto';
import { TreasureListResponseClientDto } from '@api/admin/treasure/dto/treasure-list-response.dto';
import { UpdateTreasureStateDto } from '@api/admin/treasure/dto/update-treasure-state.dto';
import { RequirePermission } from '@api/common/decorators/require-permission.decorator';
import { plainToInstance } from 'class-transformer';
import { TreasureResponseDto } from '@api/client/treasure/dto/treasure-response-dto';

@ApiTags('admin Treasure Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/treasure')
export class TreasureController {
  constructor(private readonly treasureService: TreasureService) {}

  /**
   * Create a new treasure
   * @param dto
   * @returns Promise<Treasure>
   */
  @Post('create')
  @RequirePermission(OpModule.TREASURE, OpAction.TREASURE.CREATE)
  @ApiOkResponse({ type: TreasureResponseClientDto })
  async create(@Body() dto: CreateTreasureDto) {
    const data = await this.treasureService.create(dto);
    return plainToInstance(TreasureResponseClientDto, data);
  }

  /**
   * get treasure list
   * @returns Promise<{ list: Treasure[], page: number, pageSize: number, total: number }>
   */
  @Get('list')
  @RequirePermission(OpModule.TREASURE, OpAction.TREASURE.VIEW)
  @ApiOkResponse({ type: TreasureListResponseClientDto })
  async findAll(@Query() dto: QueryTreasureDto) {
    const result = await this.treasureService.findAll(dto);

    // ✅ 先确认代码跑到了这里
    console.log('[debug] list len =', result.list?.length);

    // ✅ 用和返回一致的 DTO 来逐条转
    for (let i = 0; i < result.list.length; i++) {
      try {
        plainToInstance(TreasureResponseClientDto, result.list[i], {
          excludeExtraneousValues: true,
        });
      } catch (e) {
        console.error(
          '💥 TreasureResponseClientDto transform failed at index =',
          i,
        );
        console.error('bad item keys =', Object.keys(result.list[i]));
        console.error('bad item =', result.list[i]);
        throw e;
      }
    }

    // ✅ 再整体转换（也给同样的 options，避免“你 debug 用了 A 配置，真实用 B 配置”）
    const list = plainToInstance(TreasureResponseClientDto, result.list, {
      excludeExtraneousValues: true,
    });

    return { ...result, list };
  }
  /**
   * get treasure detail
   * @param id
   * @returns Promise<Treasure>
   */
  @Get(':id')
  @RequirePermission(OpModule.TREASURE, OpAction.TREASURE.VIEW)
  @ApiOkResponse({ type: TreasureResponseClientDto })
  async findOne(@Param('id') id: string) {
    const data = await this.treasureService.findOne(id);
    return plainToInstance(TreasureResponseClientDto, data);
  }

  /**
   * update treasure
   * @param id
   * @param dto
   * @returns Promise<Treasure>
   */
  @Patch(':id')
  @RequirePermission(OpModule.TREASURE, OpAction.TREASURE.UPDATE)
  @ApiOkResponse({ type: TreasureResponseClientDto })
  async update(@Param('id') id: string, @Body() dto: UpdateTreasureDto) {
    const data = await this.treasureService.update(id, dto);
    return plainToInstance(TreasureResponseClientDto, data);
  }

  /**
   * update treasure state
   * @param id
   * @param dto
   * @returns Promise<Treasure>
   */
  @Patch(':id/state')
  @RequirePermission(OpModule.TREASURE, OpAction.TREASURE.UPDATE)
  @ApiOkResponse({ type: TreasureResponseClientDto })
  async updateState(
    @Param('id') id: string,
    @Body() dto: UpdateTreasureStateDto,
  ) {
    const data = await this.treasureService.updateState(id, dto.state);
    return plainToInstance(TreasureResponseClientDto, data);
  }

  /**
   * delete treasure
   * @param id
   * @returns Promise<Treasure>
   */
  @Delete(':id')
  @RequirePermission(OpModule.TREASURE, OpAction.TREASURE.DELETE)
  @ApiOkResponse({ type: TreasureResponseClientDto })
  async remove(@Param('id') id: string) {
    const data = await this.treasureService.remove(id);
    return plainToInstance(TreasureResponseClientDto, data);
  }

  /**
   * Purge home cache
   * @returns Promise<void>
   */
  @Post('purge-home-cache')
  @RequirePermission(OpModule.TREASURE, OpAction.TREASURE.UPDATE)
  async purgeHomeCache() {
    return this.treasureService.purgeHomeCache();
  }
}
