import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { environments } from './environments/environments';
import * as cookieParser from 'cookie-parser';
import { TransformInterceptor } from './shared/interception/transform.interceptor';
import { ExceptionsFilter } from './shared/filter/exceptions.filter';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as ngrok from '@ngrok/ngrok';
import { LoggingInterceptor } from './shared/logging/logging.interceptor';
import { LoggerService } from './shared/logging/logger.service';

export const urlPublic = path.resolve(__dirname, '..', 'src');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // const logging = new Logging();

  app.useLogger(app.get(LoggerService));

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // enable passing cookies, authentication headers, etc.
  });
  app.useGlobalFilters(new ExceptionsFilter(app.get(LoggerService)));

  app.use(cookieParser());
  app.useGlobalInterceptors(
    // new LoggingInterceptor(logging),
    new TransformInterceptor(),
    new LoggingInterceptor(app.get(LoggerService)),
  );
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: false }));
  app.useStaticAssets(path.resolve('public'));

  app.enableShutdownHooks();

  const PORT = environments.port;

  const config = new DocumentBuilder()
    .setTitle('Apis')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'accessToken',
    )
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'refreshToken',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(PORT, async () => {
    const serverUrl = await app.getUrl();
    Logger.log(`API service has been started, please visit: ${serverUrl}`);
    Logger.log(
      `API document has been generated, please visit: ${serverUrl}/${process.env.SWAGGER_PATH}/`,
    );
  });

  // ngrok
  //   .connect({
  //     addr: PORT,
  //     authtoken: '2Yz5TUsLIdBvscaUoxBcbpOTik7_6BeC3ArNwUnuRXZ4NBHSd',
  //     domain: 'ultimate-implicitly-hound.ngrok-free.app',
  //   })
  //   .then((listener) =>
  //     Logger.log(`Ingress established at: ${listener.url()}`),
  //   );
}
bootstrap();
