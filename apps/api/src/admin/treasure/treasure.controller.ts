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
import { RolesGuard } from '@api/common/guards/roles.guard';
import { TreasureService } from '@api/admin/treasure/treasure.service';
import { Roles } from '@api/common/decorators/roles.decorator';
import { Role } from '@lucky/shared';
import { CreateTreasureDto } from '@api/admin/treasure/dto/create-treasure.dto';
import { QueryTreasureDto } from '@api/admin/treasure/dto/query-treasure.dto';
import { UpdateTreasureDto } from '@api/admin/treasure/dto/update-treasure.dto';
import { TreasureResponseDto } from '@api/admin/treasure/dto/treasure-response.dto';
import { TreasureListResponseDto } from '@api/admin/treasure/dto/treasure-list-response.dto';
import { UpdateTreasureStateDto } from '@api/admin/treasure/dto/update-treasure-state.dto';

@ApiTags('后台-产品管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/treasure')
export class TreasureController {
  constructor(private readonly treasureService: TreasureService) {}

  /**
   * Create a new treasure
   * @param dto
   * @returns Promise<Treasure>
   */
  @Post('create')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOkResponse({ type: TreasureResponseDto })
  async create(@Body() dto: CreateTreasureDto) {
    return this.treasureService.create(dto);
  }

  /**
   * get treasure list
   * @returns Promise<{ list: Treasure[], page: number, pageSize: number, total: number }>
   */
  @Get('list')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.EDITOR, Role.VIEWER)
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
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.EDITOR, Role.VIEWER)
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
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
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
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
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
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOkResponse({ type: TreasureResponseDto })
  async remove(@Param('id') id: string) {
    return this.treasureService.remove(id);
  }
}
