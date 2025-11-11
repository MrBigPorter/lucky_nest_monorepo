import {Module} from "@nestjs/common";
import {AdsController} from "@api/ads/ads.controller";
import {PrismaModule} from "@api/prisma/prisma.module";
import {AdsService} from "@api/ads/ads.service";

@Module({
    imports: [PrismaModule],
    controllers: [AdsController],
    providers: [AdsService],
    exports: []
})

export class AdsModule {}