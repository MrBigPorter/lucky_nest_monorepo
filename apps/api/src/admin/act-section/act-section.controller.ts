import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { RolesGuard } from '@api/common/guards/roles.guard';
import { Roles } from '@api/common/decorators/roles.decorator';
import { Role } from '@lucky/shared';
import { ActSectionResponseDto } from '@api/admin/act-section/dto/act-section-response.dto';
import { CreateActSectionDto } from '@api/admin/act-section/dto/create-act-section.dto';
import { ActSectionService } from '@api/admin/act-section/act-section.service';
import { plainToInstance } from 'class-transformer';
import { QueryActSectionDto } from '@api/admin/act-section/dto/query-act-section.dto';
import { UpdateActSectionDto } from '@api/admin/act-section/dto/update-act-section.dto';
import { BindSectionItemDto } from '@api/admin/act-section/dto/bind-section-item.dto';

@ApiTags('后台-首页板块管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('admin/act-sections')
export class ActSectionController {
  constructor(private readonly sectionService: ActSectionService) {}

  /**
   * Create a new act section
   * @param dto
   * @returns {Promise<ActSectionResponseDto>}
   */
  @Post('create')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOkResponse({ type: ActSectionResponseDto })
  async create(@Body() dto: CreateActSectionDto) {
    const data = await this.sectionService.create(dto);
    return plainToInstance(ActSectionResponseDto, data);
  }

  /**
   * Get act section list
   * @param query
   * @returns {Promise<ActSectionResponseDto[]>}
   */
  @Get('list')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOkResponse({ type: [ActSectionResponseDto] })
  async findAll(@Query() query: QueryActSectionDto) {
    const { list, pageSize, page, total } = await this.sectionService.findAll(
      query.page,
      query.pageSize,
    );
    const cleanList = list.map((section: any) => {
      const cleanItems = section.items
        .map((item: any) => {
          const t = item.treasure;
          if (!t) return null;
          return {
            treasureId: t.treasureId,
            treasureName: t.treasureName,
            productName: t.productName,
            treasureCoverImg: t.treasureCoverImg,
            state: t.state,

            // --- 关键：Decimal 转 Number (解决报错的核心) ---
            costAmount: t.costAmount ? Number(t.costAmount) : 0,
            unitAmount: t.unitAmount ? Number(t.unitAmount) : 0,
            seqShelvesQuantity: t.seqShelvesQuantity,
            seqBuyQuantity: t.seqBuyQuantity,
            buyQuantityRate: t.buyQuantityRate ? Number(t.buyQuantityRate) : 0,

            // --- 时间处理 ---
            createdAt: t.createdAt ? new Date(t.createdAt).getTime() : 0,
            updatedAt: t.updatedAt ? new Date(t.updatedAt).getTime() : 0,
            categories: t.categories || [],
          };
        })
        .filter((i: any) => i !== null);

      return {
        ...section,
        startAt: section.startAt ? new Date(section.startAt).getTime() : 0,
        endAt: section.endAt ? new Date(section.endAt).getTime() : 0,
        items: cleanItems || [],
      };
    });

    return {
      list: cleanList,
      page,
      pageSize,
      total: total,
    };
  }

  /**
   * Get act section by id
   * @param id
   * @returns {Promise<ActSectionResponseDto>}
   */
  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOkResponse({ type: ActSectionResponseDto })
  async findOne(@Param('id') id: string) {
    const data = await this.sectionService.findOne(id);
    return plainToInstance(ActSectionResponseDto, data, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Update act section by id
   * @param id
   * @param dto
   * @returns {Promise<ActSectionResponseDto>}
   */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOkResponse({ type: ActSectionResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateActSectionDto) {
    const data = await this.sectionService.update(id, dto);
    return plainToInstance(ActSectionResponseDto, data);
  }

  /**
   * Delete act section by id
   * @param id
   * @returns {Promise<ActSectionResponseDto>}
   */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOkResponse({ type: ActSectionResponseDto })
  async remove(@Param('id') id: string) {
    const data = await this.sectionService.remove(id);
    return plainToInstance(ActSectionResponseDto, data);
  }

  /**
   * Bind treasures to act section
   * @param id
   * @param dto
   * @returns {Promise<ActSectionResponseDto>}
   */
  @Post(':id/bind')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOkResponse({ type: ActSectionResponseDto })
  async bindTreasures(
    @Param('id') id: string,
    @Body() dto: BindSectionItemDto,
  ) {
    const data = await this.sectionService.bindTreasures(id, dto);
    return plainToInstance(ActSectionResponseDto, data);
  }

  /**
   * Unbind treasure from act section
   * @param id
   * @param treasureId
   * @returns {Promise<ActSectionResponseDto>}
   */
  @Delete(':id/unbind/:treasureId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOkResponse({ type: ActSectionResponseDto })
  async unbindTreasure(
    @Param('id') id: string,
    @Param('treasureId') treasureId: string,
  ) {
    const data = await this.sectionService.unbindTreasure(id, treasureId);
    return plainToInstance(ActSectionResponseDto, data);
  }
}
