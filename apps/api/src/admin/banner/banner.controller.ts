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
import { BannerService } from '@api/admin/banner/banner.service';
import { Roles } from '@api/common/decorators/roles.decorator';
import { BannerResponseDto } from '@api/admin/banner/dto/banner-response.dto';
import { CreateBannerDto } from '@api/admin/banner/dto/create-banner.dto';
import { plainToInstance } from 'class-transformer';
import { Role } from '@lucky/shared';
import { QueryBannerDto } from '@api/admin/banner/dto/query-banner.dto';
import { UpdateBannerDto } from '@api/admin/banner/dto/update-banner.dto';
import { UpdateBannerStateDto } from '@api/admin/banner/dto/update-banner-state.dto';

@ApiTags('后台-轮播图管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('admin/banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Post('create')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOkResponse({ type: BannerResponseDto })
  async create(@Body() dto: CreateBannerDto) {
    const data = await this.bannerService.create(dto);
    return plainToInstance(BannerResponseDto, data);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOkResponse({ type: BannerResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    const data = await this.bannerService.update(id, dto);
    return plainToInstance(BannerResponseDto, data);
  }

  @Get('list')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOkResponse({ type: [BannerResponseDto] })
  async findAll(@Query() query: QueryBannerDto) {
    const { list, pageSize, page, total } =
      await this.bannerService.findAll(query);
    const cleanList = list.map((banner: any) => {
      return plainToInstance(BannerResponseDto, banner);
    });
    return { list: cleanList, pageSize, page, total };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOkResponse({ type: BannerResponseDto })
  async findOne(@Param('id') id: string) {
    const data = await this.bannerService.findOne(id);
    return plainToInstance(BannerResponseDto, data);
  }

  @Patch(':id/state')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOkResponse({ type: BannerResponseDto })
  async updateState(
    @Param('id') id: string,
    @Body() dto: UpdateBannerStateDto,
  ) {
    const data = await this.bannerService.updateState(id, dto.state);
    return plainToInstance(BannerResponseDto, data);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOkResponse({ type: Boolean })
  async remove(@Param('id') id: string) {
    return this.bannerService.remove(id);
  }
}
