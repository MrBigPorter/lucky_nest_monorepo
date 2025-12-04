import {Module} from "@nestjs/common";
import {PrismaService} from "@api/common/prisma/prisma.service";
import {UserController} from "@api/admin/user/user.controller";
import {UserService} from "@api/admin/user/user.service";
import {PrismaModule} from "@api/common/prisma/prisma.module";

@Module({
    imports:[PrismaModule],
    controllers:[UserController],
    providers:[UserService]
})

export class UserModule{}