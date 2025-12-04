import {Controller, Get, Query, UseGuards} from "@nestjs/common";
import {UserService} from "@api/admin/user/user.service";
import {AdminListDto} from "@api/admin/user/dto/admin-list.dto";
import {ApiBearerAuth} from "@nestjs/swagger";
import {JwtAuthGuard} from "@api/common/jwt/jwt.guard";
import {RolesGuard} from "@api/common/guards/roles.guard";
import {Roles} from "@api/common/decorators/roles.decorator";
import {Role} from "@lucky/shared";

@Controller('admin/user')
export class UserController {
  constructor(private readonly userService: UserService) {
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.ADMIN,Role.SUPER_ADMIN)
  @Get('list')
  async adminList(@Query() query: AdminListDto) {
    return this.userService.adminList(query);
  }
}