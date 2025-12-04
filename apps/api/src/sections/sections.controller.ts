import { Controller, Get, Query } from '@nestjs/common';
import { SectionsService } from '@api/sections/sections.service';

@Controller('home')
export class SectionsController {
  constructor(private readonly svc: SectionsService) {}

  @Get('sections')
  async sections(@Query('limit') limit?: string) {
    const n = Number(limit ?? 10);
    return await this.svc.getHomeSections(Number.isFinite(n) ? n : 10);
  }
}
