import {Controller, Get, Query} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";
import {BannersService} from "@api/banners/banners.service";
import {BannerQueryDto} from "@api/banners/dto/banner-query.dto";

@ApiTags('Banners')
@Controller('banners')
export class BannersController {
    constructor(private readonly svc: BannersService) {}

    @Get()
    async list(@Query() query:BannerQueryDto){
        return this.svc.list(query);
    }
}