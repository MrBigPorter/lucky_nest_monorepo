import {Module} from "@nestjs/common";
import {PrismaModule} from "@api/prisma/prisma.module";
import {TreasureController} from "@api/treasure/treasure.controller";
import {TreasureService} from "@api/treasure/treasure.service";

@Module({
    imports: [PrismaModule],
    controllers: [TreasureController],
    providers: [TreasureService],
})

export class TreasureModule {}