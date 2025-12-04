import {Module} from "@nestjs/common";
import {UserController} from "@api/admin/user/user.controller";
import {UserService} from "@api/admin/user/user.service";
import {PrismaModule} from "@api/common/prisma/prisma.module";
import {PasswordService} from "@api/common/service/password.service";

@Module({
    imports:[PrismaModule],
    controllers:[UserController],
    providers:[UserService, PasswordService]
})

export class UserModule{}