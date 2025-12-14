import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PermissionsGuard } from '@api/common/guards/permissions.guard';
import { CategoryService } from '@api/admin/category/category.service';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { OpAction, OpModule, Role } from '@lucky/shared';
import { CreateCategoryDto } from '@api/admin/category/dto/create-category.dto';
import { UpdateCategoryDto } from '@api/admin/category/dto/update-category.dto';
import { RequirePermission } from '@api/common/decorators/require-permission.decorator';

@ApiTags('Admin Category Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * Create a new category
   * @param dto
   */
  @Post('create')
  @RequirePermission(OpModule.MARKETING, OpAction.MARKETING.CREATE)
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  /**
   * Get category list
   *
   */
  @Get('list')
  @RequirePermission(OpModule.MARKETING, OpAction.MARKETING.VIEW)
  async findAll() {
    return this.categoryService.findAll();
  }

  /**
   * Get category details by ID
   * @param id
   */
  @Get(':id')
  @RequirePermission(OpModule.MARKETING, OpAction.MARKETING.VIEW)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  /**
   * Update an existing category
   * @param id
   * @param dto
   */
  @Patch(':id')
  @RequirePermission(OpModule.MARKETING, OpAction.MARKETING.UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, dto);
  }

  /**
   * Update category state
   * @param id
   * @param state
   */
  @Patch(':id/state')
  @RequirePermission(OpModule.MARKETING, OpAction.MARKETING.UPDATE)
  async updateState(
    @Param('id', ParseIntPipe) id: number,
    @Body('state', ParseIntPipe) state: number,
  ) {
    return this.categoryService.updateState(id, state);
  }

  /**
   * Delete a category by ID
   * @param id
   */
  @Delete(':id')
  @RequirePermission(OpModule.MARKETING, OpAction.MARKETING.DELETE)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }
}
