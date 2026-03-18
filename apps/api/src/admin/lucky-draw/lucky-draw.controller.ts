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
import { AdminLuckyDrawService } from './lucky-draw.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CreatePrizeDto } from './dto/create-prize.dto';
import { UpdatePrizeDto } from './dto/update-prize.dto';
import { QueryResultsDto } from './dto/query-results.dto';
import { AdminJwtAuthGuard } from '../auth/admin-jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@lucky/shared';

@Controller('admin/lucky-draw')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
export class AdminLuckyDrawController {
  constructor(private readonly service: AdminLuckyDrawService) {}

  // ── 活动 ─────────────────────────────────────────────────────────

  /** GET /v1/admin/lucky-draw/activities */
  @Get('activities')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.EDITOR)
  listActivities() {
    return this.service.listActivities();
  }

  /** GET /v1/admin/lucky-draw/activities/:id */
  @Get('activities/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.EDITOR)
  getActivity(@Param('id') id: string) {
    return this.service.getActivity(id);
  }

  /** POST /v1/admin/lucky-draw/activities */
  @Post('activities')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.EDITOR)
  createActivity(@Body() dto: CreateActivityDto) {
    return this.service.createActivity(dto);
  }

  /** PATCH /v1/admin/lucky-draw/activities/:id */
  @Patch('activities/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.EDITOR)
  updateActivity(@Param('id') id: string, @Body() dto: UpdateActivityDto) {
    return this.service.updateActivity(id, dto);
  }

  /** DELETE /v1/admin/lucky-draw/activities/:id */
  @Delete('activities/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  deleteActivity(@Param('id') id: string) {
    return this.service.deleteActivity(id);
  }

  // ── 奖品 ─────────────────────────────────────────────────────────

  /** GET /v1/admin/lucky-draw/activities/:id/prizes */
  @Get('activities/:id/prizes')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.EDITOR)
  listPrizes(@Param('id') activityId: string) {
    return this.service.listPrizes(activityId);
  }

  /** POST /v1/admin/lucky-draw/prizes */
  @Post('prizes')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.EDITOR)
  createPrize(@Body() dto: CreatePrizeDto) {
    return this.service.createPrize(dto);
  }

  /** PATCH /v1/admin/lucky-draw/prizes/:id */
  @Patch('prizes/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.EDITOR)
  updatePrize(@Param('id') id: string, @Body() dto: UpdatePrizeDto) {
    return this.service.updatePrize(id, dto);
  }

  /** DELETE /v1/admin/lucky-draw/prizes/:id */
  @Delete('prizes/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  deletePrize(@Param('id') id: string) {
    return this.service.deletePrize(id);
  }

  // ── 抽奖结果 ──────────────────────────────────────────────────────

  /** GET /v1/admin/lucky-draw/results */
  @Get('results')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  listResults(@Query() dto: QueryResultsDto) {
    return this.service.listResults(dto);
  }
}
