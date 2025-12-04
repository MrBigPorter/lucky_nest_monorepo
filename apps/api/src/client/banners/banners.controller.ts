import {
  Controller,
  Get,
  Header,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BannersService } from '@api/client/banners/banners.service';
import { BannerQueryDto } from '@api/client/banners/dto/banner-query.dto';
import { CacheTTL } from '@nestjs/cache-manager';
import { PublicCacheInterceptor } from '@api/common/cache/public-cache.interceptor';

@ApiTags('Banners')
@UseInterceptors(PublicCacheInterceptor) //enable cache
@Controller('banners')
export class BannersController {
  constructor(private readonly svc: BannersService) {}

  @Get()
  @CacheTTL(300_000)
  @Header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=30')
  async list(@Query() query: BannerQueryDto) {
    return this.svc.list(query);
  }
}
