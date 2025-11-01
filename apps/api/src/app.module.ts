import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import {PrismaModule} from "./prisma/prisma.module";
import {AppController} from "./app.controller";
import {AppService} from "./app.service";
import { ThrottlerModule} from "@nestjs/throttler";
import {AuthModule} from "./auth/auth.module"; // 如果你 tsconfig 没开 esModuleInterop，用这种写法最稳
import { APP_GUARD } from '@nestjs/core';
import {OtpThrottlerGuard} from "./common/guards/otp-throttler.guard";
import {OtpModule} from "./otp/otp.module";
import {HealthController} from "@api/health/health.controller";
import {TreasureModule} from "@api/treasure/treasure.module";
import {CategoryModule} from "@api/category/category.module";

// 根模块（第2步，挂子模块、配置、JWT等）
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object({
                JWT_SECRET: Joi.string().required(),
                JWT_EXPIRES_IN: Joi.alternatives().try(
                    Joi.number().integer().positive(),
                    Joi.string().pattern(/^\d+(ms|s|m|h|d|w|y)$/)
                ).default('15m'),
                // 其余变量也可顺手校验：PORT、CORS_ORIGIN、DATABASE_URL...
            }),
            validationOptions: { abortEarly: false, allowUnknown: true, convert: true },
        }),
        //全局默认 ttl: 60,     // 60s 窗口
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 60 }]),
        //根模块，把业务模块“挂进来”。Nest 会读这些元数据，生成依赖图。
        PrismaModule,
        AuthModule,
        OtpModule,
        TreasureModule,
        CategoryModule


        // 其他模块：PrismaModule、ThrottlerModule、UsersModule、AuthModule 等
    ],
    controllers: [AppController,HealthController],
    providers: [
        AppService,
        //让限流生效：把 ThrottlerGuard 设为全局守卫，否则 @Throttle 不会拦截。
        {provide: APP_GUARD, useClass: OtpThrottlerGuard}
    ],
})
export class AppModule {}