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
import { PermissionsGuard } from '@api/common/guards/permissions.guard';
import { BannerService } from '@api/admin/banner/banner.service';
import { BannerResponseDto } from '@api/admin/banner/dto/banner-response.dto';
import { CreateBannerDto } from '@api/admin/banner/dto/create-banner.dto';
import { plainToInstance } from 'class-transformer';
import { OpAction, OpModule, Role } from '@lucky/shared';
import { QueryBannerDto } from '@api/admin/banner/dto/query-banner.dto';
import { UpdateBannerDto } from '@api/admin/banner/dto/update-banner.dto';
import { UpdateBannerStateDto } from '@api/admin/banner/dto/update-banner-state.dto';
import { RequirePermission } from '@api/common/decorators/require-permission.decorator';

@ApiTags('admin Banner Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('admin/banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  /**
   * Create a new banner
   * @param dto
   */
  @Post('create')
  @RequirePermission(OpModule.MARKETING, OpAction.MARKETING.CREATE)
  @ApiOkResponse({ type: BannerResponseDto })
  async create(@Body() dto: CreateBannerDto) {
    const data = await this.bannerService.create(dto);
    return plainToInstance(BannerResponseDto, data);
  }

  /**
   * Update an existing banner
   * @param id
   * @param dto
   */
  @Patch(':id')
  @RequirePermission(OpModule.MARKETING, OpAction.MARKETING.UPDATE)
  @ApiOkResponse({ type: BannerResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    const data = await this.bannerService.update(id, dto);
    return plainToInstance(BannerResponseDto, data);
  }

  /**
   * Get banner list
   * @param query
   */
  @Get('list')
  @RequirePermission(OpModule.MARKETING, OpAction.MARKETING.VIEW)
  @ApiOkResponse({ type: [BannerResponseDto] })
  async findAll(@Query() query: QueryBannerDto) {
    const { list, pageSize, page, total } =
      await this.bannerService.findAll(query);
    const cleanList = list.map((banner: any) => {
      return plainToInstance(BannerResponseDto, banner);
    });
    return { list: cleanList, pageSize, page, total };
  }

  /**
   * Get banner details by ID
   * @param id
   */
  @Get(':id')
  @RequirePermission(OpModule.MARKETING, OpAction.MARKETING.VIEW)
  @ApiOkResponse({ type: BannerResponseDto })
  async findOne(@Param('id') id: string) {
    const data = await this.bannerService.findOne(id);
    return plainToInstance(BannerResponseDto, data);
  }

  /**
   * Update banner state
   * @param id
   * @param dto
   */
  @Patch(':id/state')
  @RequirePermission(OpModule.MARKETING, OpAction.MARKETING.UPDATE)
  @ApiOkResponse({ type: BannerResponseDto })
  async updateState(
    @Param('id') id: string,
    @Body() dto: UpdateBannerStateDto,
  ) {
    const data = await this.bannerService.updateState(id, dto.state);
    return plainToInstance(BannerResponseDto, data);
  }

  /**
   * Delete a banner by ID
   * @param id
   */
  @Delete(':id')
  @RequirePermission(OpModule.MARKETING, OpAction.MARKETING.DELETE)
  @ApiOkResponse({ type: Boolean })
  async remove(@Param('id') id: string) {
    return this.bannerService.remove(id);
  }
}
