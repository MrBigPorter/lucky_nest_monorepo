import {Module} from "@nestjs/common";
import {AuthModule} from "@api/admin/auth/auth.module";
import {UserModule} from "@api/admin/user/user.module";

@Module({
    imports:[
        AuthModule,
        UserModule
    ],
    providers:[],
    controllers:[]
})

export class AdminModule{}