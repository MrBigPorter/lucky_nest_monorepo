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
import { TreasureResponseDto } from '@api/admin/treasure/dto/treasure-response.dto';
import { TreasureListResponseDto } from '@api/admin/treasure/dto/treasure-list-response.dto';
import { UpdateTreasureStateDto } from '@api/admin/treasure/dto/update-treasure-state.dto';
import { RequirePermission } from '@api/common/decorators/require-permission.decorator';

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
  @ApiOkResponse({ type: TreasureResponseDto })
  async create(@Body() dto: CreateTreasureDto) {
    return this.treasureService.create(dto);
  }

  /**
   * get treasure list
   * @returns Promise<{ list: Treasure[], page: number, pageSize: number, total: number }>
   */
  @Get('list')
  @RequirePermission(OpModule.TREASURE, OpAction.TREASURE.VIEW)
  @ApiOkResponse({ type: TreasureListResponseDto })
  async findAll(@Query() dto: QueryTreasureDto) {
    return this.treasureService.findAll(dto);
  }

  /**
   * get treasure detail
   * @param id
   * @returns Promise<Treasure>
   */
  @Get(':id')
  @RequirePermission(OpModule.TREASURE, OpAction.TREASURE.VIEW)
  @ApiOkResponse({ type: TreasureResponseDto })
  async findOne(@Param('id') id: string) {
    return this.treasureService.findOne(id);
  }

  /**
   * update treasure
   * @param id
   * @param dto
   * @returns Promise<Treasure>
   */
  @Patch(':id')
  @RequirePermission(OpModule.TREASURE, OpAction.TREASURE.UPDATE)
  @ApiOkResponse({ type: TreasureResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateTreasureDto) {
    return this.treasureService.update(id, dto);
  }

  /**
   * update treasure state
   * @param id
   * @param dto
   * @returns Promise<Treasure>
   */
  @Patch(':id/state')
  @RequirePermission(OpModule.TREASURE, OpAction.TREASURE.UPDATE)
  @ApiOkResponse({ type: TreasureResponseDto })
  async updateState(
    @Param('id') id: string,
    @Body() dto: UpdateTreasureStateDto,
  ) {
    return this.treasureService.updateState(id, dto.state);
  }

  /**
   * delete treasure
   * @param id
   * @returns Promise<Treasure>
   */
  @Delete(':id')
  @RequirePermission(OpModule.TREASURE, OpAction.TREASURE.DELETE)
  @ApiOkResponse({ type: TreasureResponseDto })
  async remove(@Param('id') id: string) {
    return this.treasureService.remove(id);
  }
}
