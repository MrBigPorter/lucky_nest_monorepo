import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LoginLogService } from './login-log.service';
import { QueryLoginLogDto } from './dto/query-login-log.dto';
import { AdminJwtAuthGuard } from '../auth/admin-jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@lucky/shared';

@Controller('v1/admin/login-logs')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
export class LoginLogController {
  constructor(private readonly loginLogService: LoginLogService) {}

  /** GET /v1/admin/login-logs/list — 登录日志分页列表 */
  @Get('list')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  getList(@Query() query: QueryLoginLogDto) {
    return this.loginLogService.getList(query);
  }
}
