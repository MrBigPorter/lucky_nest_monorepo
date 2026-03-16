import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';
import { AdminJwtAuthGuard } from '../auth/admin-jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@lucky/shared';

@Controller('v1/admin/system-config')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
export class SystemConfigController {
  constructor(private readonly service: SystemConfigService) {}

  /** GET /v1/admin/system-config — 全部配置项 */
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  getAll() {
    return this.service.getAll();
  }

  /** PATCH /v1/admin/system-config/:key — 更新单项 */
  @Patch(':key')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  update(@Param('key') key: string, @Body() dto: UpdateSystemConfigDto) {
    return this.service.update(key, dto);
  }
}
