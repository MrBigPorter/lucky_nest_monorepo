import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { PrismaModule } from '@api/common/prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ClientModule } from '@api/client/client.module';
import { AdminModule } from '@api/admin/admin.module';
import { APP_GUARD } from '@nestjs/core';
import { OtpThrottlerGuard } from '@api/common/guards/otp-throttler.guard';
import { UploadModule } from '@api/common/upload/upload.module';

// 根模块（第2步，挂子模块、配置、JWT等）
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.alternatives()
          .try(
            Joi.number().integer().positive(),
            Joi.string().pattern(/^\d+(ms|s|m|h|d|w|y)$/),
          )
          .default('15m'),
        DATABASE_URL: Joi.string().required(),

        CACHE_TTL: Joi.number().integer().positive().default(300),
        CACHE_PREFIX: Joi.string().default('lucky:'),
        REDIS_URL: Joi.string().required(),
        PORT: Joi.number().default(3000),
        // 其余变量也可顺手校验：PORT、CORS_ORIGIN、DATABASE_URL...
      }),
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
        convert: true,
      },
    }),

    // 2) 全局缓存：用 Redis 作为 store
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (cfg: ConfigService) => ({
        store: await redisStore({
          url: cfg.get<string>('REDIS_URL')!,
          keyPrefix: cfg.get<string>('CACHE_PREFIX')!,
          ttl: (cfg.get<number>('CACHE_TTL') ?? 300) * 1000, // 单位：秒
          socket: {
            // 温和重连，避免连接抖动崩溃
            reconnectStrategy: (retries) => Math.min(2000, 100 * (retries + 1)),
          },
        }),
      }),
    }),
    //全局默认 ttl: 60,     // 60s 窗口
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 60 }]),
    //根模块，把业务模块“挂进来”。Nest 会读这些元数据，生成依赖图。
    PrismaModule,
    UploadModule,
    ClientModule,
    AdminModule,

    // 其他模块：PrismaModule、ThrottlerModule、UsersModule、AuthModule 等
  ],

  controllers: [AppController],
  providers: [
    AppService,
    //让限流生效：把 ThrottlerGuard 设为全局守卫，否则 @Throttle 不会拦截。
    { provide: APP_GUARD, useClass: OtpThrottlerGuard },
  ],
})
export class AppModule {}
