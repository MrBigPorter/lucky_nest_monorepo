import {Module} from "@nestjs/common";
import {AuthModule} from "@api/admin/auth/auth.module";
import {UserModule} from "@api/admin/user/user.module";
import {CategoryModule} from "@api/admin/category/category.module";

@Module({
    imports:[
        AuthModule,
        UserModule,
        CategoryModule
    ],
    providers:[],
    controllers:[]
})

export class AdminModule{}