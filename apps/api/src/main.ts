import {HttpAdapterHost, NestFactory} from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import {PrismaService} from "./prisma/prisma.service";
import morganBody from "morgan-body";
import {requestId} from "@api/common/middleware/request-id";
import {AllExceptionsFilter} from "@api/common/filters/all-exceptions.filter";
import {ResponseWrapInterceptor} from "@api/common/interceptors/response-wrap.interceptor";

//启动入口（第1步）
async function bootstrap() {
    const isProd = process.env.NODE_ENV === 'production';

    // NestFactory.create(AppModule) 创建应用实例
    const app = await NestFactory.create(AppModule);

    // 优雅关闭打开
    const prisma = app.get(PrismaService);
    await prisma.enableShutdownHooks(app);

    // ✅ 从容器里拿配置 get config from container
    const config = app.get(ConfigService);
    // port 和 host 都从 env 里取
    const port = config.get<number>('PORT', 4000);
    const host = config.get<string>('HOST', '0.0.0.0');
    // ✅ 支持逗号分隔多个域 support multiple domains separated by comma
    const corsOrigin = (config.get<string>('CORS_ORIGIN', 'http://localhost:3000')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean));

    // 全局前缀、版本号 global prefix and versioning
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

    // 1) 请求ID
    app.use(requestId());

    // 安全中间件、Cookie、中间件 security middleware, cookie parser, middleware
    app.use(helmet());
    app.use(cookieParser());
    // ✅ 用 env 的白名单 whitelist
    app.enableCors({ origin: corsOrigin, credentials: true });

    // 全局管道 global pipes 全局管道，校验与类型转换。
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
    }));

    app.useGlobalInterceptors(
        //统一把返回包成 {code,message,tid,data}
        new ResponseWrapInterceptor()
    )

    // 4) 异常过滤器
    const adapterHost = app.get(HttpAdapterHost);
    app.useGlobalFilters(new AllExceptionsFilter(adapterHost));

    // 例子：GET /api/v1/auth/otp/request 200 12.3 ms - 22
    if (!isProd) {
        const expressApp: import('express').Application = app.getHttpAdapter().getInstance();

        morganBody(expressApp, {
            logResponseBody: true,      // ✅ 打印“返回结果”
            maxBodyLength: 1000,        // 避免超长刷屏
        });
    }

    // Swagger 生成 UI 与 OpenAPI 规范
    const swaggerCfg = new DocumentBuilder()
        .setTitle('Lucky API')
        .setDescription('REST API for web/mobile')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const doc = SwaggerModule.createDocument(app, swaggerCfg);
    SwaggerModule.setup('docs', app, doc);
    // ✅ 用 env 的端口/主机 port/host
    await app.listen(port, host);
    console.log(`API → http://${host}:${port}  Docs → /docs  Health → /api/health`);
}
// NOSONAR
bootstrap();