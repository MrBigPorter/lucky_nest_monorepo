import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '@api/admin/user/user.service';
import { AdminListDto } from '@api/admin/user/dto/admin-list.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/common/jwt/jwt.guard';
import { RolesGuard } from '@api/common/guards/roles.guard';
import { Roles } from '@api/common/decorators/roles.decorator';
import { Role } from '@lucky/shared';
import { UpdateAdminDto } from '@api/admin/user/dto/update-admin.dto';
import { CurrentUserId } from '@api/common/decorators/user.decorator';
import { CreateAdminDto } from '@api/admin/user/dto/create-admin.dto';

@ApiTags('管理员管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('list')
  async adminList(@Query() query: AdminListDto) {
    return this.userService.adminList(query);
  }

  @Roles(Role.SUPER_ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
    @CurrentUserId() userId: string,
  ) {
    return this.userService.update(id, updateAdminDto, userId);
  }

  @Post('create')
  @Roles(Role.SUPER_ADMIN)
  async create(@Body() dto: CreateAdminDto) {
    return this.userService.create(dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
