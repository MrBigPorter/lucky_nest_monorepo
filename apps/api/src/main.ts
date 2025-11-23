import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import morganBody from 'morgan-body';
import { requestId } from '@api/common/middleware/request-id';
import { AllExceptionsFilter } from '@api/common/filters/all-exceptions.filter';
import { ResponseWrapInterceptor } from '@api/common/interceptors/response-wrap.interceptor';

const isProd = process.env.NODE_ENV === 'production';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();

  // 配置
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3000);
  const host = config.get<string>('HOST', '0.0.0.0');
  const corsOrigins = (config.get<string>('CORS_ORIGIN', 'http://localhost:3000')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean));


  // 前缀 + 版本
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // 请求 ID
  app.use(requestId());

  // 安全 / cookie / CORS
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors(
     isProd ? {
         origin: (origin: string, cb: (arg0: Error | null, arg1: boolean) => void) => {
             if (!origin) return cb(null, true);
             const ok = corsOrigins.includes(origin);
             cb(ok ? null : new Error(`CORS blocked: ${origin}`), ok);
         },
         credentials: true,
         methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
         allowedHeaders: ['*'], // 放行所有请求头 allow any header
         exposedHeaders: ['Content-Disposition']
     }: {
         //  开发环境全开：回显任意来源（支持携带凭证）
         origin: (origin: any, cb: (arg0: null, arg1: boolean) => any) => cb(null, true),
         credentials: true,
         methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
         allowedHeaders: ['*'],
         exposedHeaders: ['Content-Disposition'],
         optionsSuccessStatus: 204,
     }
  );

  // global validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: false },// block type conversion
  }));

  // 统一响应壳 response wrap
  app.useGlobalInterceptors(
      new ResponseWrapInterceptor(app.get('Reflector'))
  );

  // 全局异常 global exception filter
  const adapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(adapterHost));

  // 请求/响应日志（非生产） req/res body
  if (!isProd) {
    const expressApp: import('express').Application = app.getHttpAdapter().getInstance();
    morganBody(expressApp, { logResponseBody: true, maxBodyLength: 1000 });
  }

  // Swagger（开发环境默认开；生产用 ENABLE_DOCS 控制） just for dev
  if (!isProd) {
    const swaggerCfg = new DocumentBuilder()
      .setTitle('Lucky API')
      .setDescription('REST API for web/mobile')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const doc = SwaggerModule.createDocument(app, swaggerCfg);
    SwaggerModule.setup('docs', app, doc);

  }

  await app.listen(port, host);
  console.log(`API → http://${host}:${port}  Docs → /docs  Health → /api/health`);
}

// NOSONAR
bootstrap();