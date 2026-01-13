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
import { UpdateTreasureStateDto } from '@api/admin/treasure/dto/update-treasure-state.dto';
import { RequirePermission } from '@api/common/decorators/require-permission.decorator';
import { plainToInstance } from 'class-transformer';
import { AdminTreasureResponseDto } from '@api/admin/treasure/dto/treasure-response.dto';

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
  @ApiOkResponse({ type: AdminTreasureResponseDto })
  async create(@Body() dto: CreateTreasureDto) {
    const data = await this.treasureService.create(dto);
    return plainToInstance(AdminTreasureResponseDto, data);
  }

  /**
   * get treasure list
   * @returns Promise<{ list: Treasure[], page: number, pageSize: number, total: number }>
   */
  @Get('list')
  @RequirePermission(OpModule.TREASURE, OpAction.TREASURE.VIEW)
  @ApiOkResponse({ type: AdminTreasureResponseDto })
  async findAll(@Query() dto: QueryTreasureDto) {
    const result = await this.treasureService.findAll(dto);

    return {
      list: plainToInstance(AdminTreasureResponseDto, result.list),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    };
  }
  /**
   * get treasure detail
   * @param id
   * @returns Promise<Treasure>
   */
  @Get(':id')
  @RequirePermission(OpModule.TREASURE, OpAction.TREASURE.VIEW)
  @ApiOkResponse({ type: AdminTreasureResponseDto })
  async findOne(@Param('id') id: string) {
    const data = await this.treasureService.findOne(id);
    return plainToInstance(AdminTreasureResponseDto, data);
  }

  /**
   * update treasure
   * @param id
   * @param dto
   * @returns Promise<Treasure>
   */
  @Patch(':id')
  @RequirePermission(OpModule.TREASURE, OpAction.TREASURE.UPDATE)
  @ApiOkResponse({ type: AdminTreasureResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateTreasureDto) {
    const data = await this.treasureService.update(id, dto);
    return plainToInstance(AdminTreasureResponseDto, data);
  }

  /**
   * update treasure state
   * @param id
   * @param dto
   * @returns Promise<Treasure>
   */
  @Patch(':id/state')
  @RequirePermission(OpModule.TREASURE, OpAction.TREASURE.UPDATE)
  @ApiOkResponse({ type: AdminTreasureResponseDto })
  async updateState(
    @Param('id') id: string,
    @Body() dto: UpdateTreasureStateDto,
  ) {
    const data = await this.treasureService.updateState(id, dto.state);
    return plainToInstance(AdminTreasureResponseDto, data);
  }

  /**
   * delete treasure
   * @param id
   * @returns Promise<Treasure>
   */
  @Delete(':id')
  @RequirePermission(OpModule.TREASURE, OpAction.TREASURE.DELETE)
  @ApiOkResponse({ type: AdminTreasureResponseDto })
  async remove(@Param('id') id: string) {
    const data = await this.treasureService.remove(id);
    return plainToInstance(AdminTreasureResponseDto, data);
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
