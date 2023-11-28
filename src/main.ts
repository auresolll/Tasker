import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { environments } from './environments/environments';
import * as cookieParser from 'cookie-parser';
import { TransformInterceptor } from './shared/interception/transform.interceptor';
import { ExceptionsFilter } from './shared/filter/exceptions.filter';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as ngrok from '@ngrok/ngrok';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());
  app.useGlobalInterceptors(
    // new LoggingInterceptor(logging),
    new TransformInterceptor(),
  );
  app.useGlobalFilters(new ExceptionsFilter());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: false }));
  app.useStaticAssets(path.resolve('public'));

  app.enableShutdownHooks();

  const PORT = environments.port;

  const config = new DocumentBuilder()
    .setTitle('Apis')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(PORT, () => {
    console.log(`Server đang chạy trên PORT ${PORT}`);
  });

  ngrok
    .connect({
      addr: PORT,
      authtoken: '2Yn1Zdp2gr0iRt0yzJXsQ9x07mo_3sSVhhfQXsCbQJGatjNrw',
      domain: 'mint-flexible-tortoise.ngrok-free.app'
    })
    .then((listener) =>
      console.log(`Ingress established at: ${listener.url()}`),
    );
}
bootstrap();
