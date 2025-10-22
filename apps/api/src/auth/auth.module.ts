
//记忆：模块四件套 = imports / providers / controllers / exports。
// imports 引依赖、providers 提供能力、controllers 出接口、exports 让别人用你。

import {Module} from "@nestjs/common";
import {PrismaModule} from "../prisma/prisma.module";
import {JwtModule} from "@nestjs/jwt";
import {AuthService} from "./auth.service";
import {AuthController} from "./auth.controller";

@Module({
    //imports 引依赖
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET!,
            signOptions:{ expiresIn: process.env.JWT_EXPIRES_IN || '15m'},
        }),
    ],
    //providers 提供能力 本模块内部能用（AuthService、JwtStrategy）
    providers: [AuthService, JwtStrategy],
    //controllers 出接口
    controllers: [AuthController],
    // 其他模块 imports 了 AuthModule 后也能用
    exports: [AuthService],
})