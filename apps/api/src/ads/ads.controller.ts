import {Controller, Get, Query} from "@nestjs/common";
import {AdsService} from "@api/ads/ads.service";
import {AdQueryDto} from "@api/ads/dto/ad-query.dto";

@Controller('ads')
@Controller()
export class AdsController {
    constructor(private readonly svc: AdsService) {}

    @Get()
    async list(@Query() query:AdQueryDto){
        return this.svc.list(query);
    }
}