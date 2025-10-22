// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import {PrismaModule} from "./prisma/prisma.module";
import {AppController} from "./app.controller";
import {AppService} from "./app.service"; // 如果你 tsconfig 没开 esModuleInterop，用这种写法最稳

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
        //根模块，把业务模块“挂进来”。Nest 会读这些元数据，生成依赖图。
        PrismaModule,
        // 其他模块：PrismaModule、ThrottlerModule、UsersModule、AuthModule 等
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}