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

  // 前缀 + 版本
  app.setGlobalPrefix('api');
  (app as any).set('trust proxy', 1);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // 请求 ID
  app.use(requestId());

  // 安全 / cookie / CORS
  //禁用 Helmet 的跨域资源策略，否则 Nginx 的 CORS 头会被覆盖或冲突
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );
  app.use(cookieParser());

  // global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: false }, // block type conversion
    }),
  );

  // 统一响应壳 response wrap
  app.useGlobalInterceptors(new ResponseWrapInterceptor(app.get('Reflector')));

  // 全局异常 global exception filter
  const adapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(adapterHost));

  // 请求/响应日志（非生产） req/res body
  if (!isProd) {
    const expressApp: import('express').Application = app
      .getHttpAdapter()
      .getInstance();
    morganBody(expressApp, { logResponseBody: true, maxBodyLength: 1000 });
  }

  // Swagger（开发环境默认开；生产用 ENABLE_DOCS 控制） just for dev
  if (!isProd) {
    const swaggerCfg = new DocumentBuilder()
      .setTitle(' mini-shop-client API')
      .setDescription('REST API for web/mobile')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const doc = SwaggerModule.createDocument(app, swaggerCfg);
    SwaggerModule.setup('docs', app, doc);
  }

  await app.listen(port, host);
  console.log(
    `API → http://${host}:${port}  Docs → /docs  Health → /api/health`,
  );
}

// NOSONAR
bootstrap();
