import {Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards} from "@nestjs/common";
import {ApiBearerAuth, ApiTags} from "@nestjs/swagger";
import {RolesGuard} from "@api/common/guards/roles.guard";
import {CategoryService} from "@api/admin/category/category.service";
import {JwtAuthGuard} from "@api/common/jwt/jwt.guard";
import {Roles} from "@api/common/decorators/roles.decorator";
import {Role} from "@lucky/shared";
import {CreateCategoryDto} from "@api/admin/category/dto/create-category.dto";
import {UpdateCategoryDto} from "@api/admin/category/dto/update-category.dto";

@ApiTags('后台-分类管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/category')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {
    }

    @Post('create')
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    async create(@Body() dto: CreateCategoryDto) {
        return this.categoryService.create(dto)
    }

    @Get('list')
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.EDITOR, Role.VIEWER)
    async findAll(){
        return this.categoryService.findAll()
    }

    @Patch(':id')
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto:UpdateCategoryDto){
        return this.categoryService.update(id, dto)
    }

    @Patch(':id/state')
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    async updateState(@Param('id', ParseIntPipe) id: number, @Body('state', ParseIntPipe) state: number){
        return this.categoryService.updateState(id, state);
    }

    @Delete(':id')
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    async remove(@Param('id', ParseIntPipe) id: number){
        return this.categoryService.remove(id)
    }

}
