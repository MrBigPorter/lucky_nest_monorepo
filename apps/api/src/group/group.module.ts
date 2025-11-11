import {Module} from "@nestjs/common";
import {PrismaModule} from "@api/prisma/prisma.module";
import {GroupController} from "@api/group/group.controller";
import {GroupService} from "@api/group/group.service";

@Module({
    imports: [PrismaModule],
    controllers: [GroupController],
    providers: [GroupService],
    exports: []
})

export class GroupModule {}