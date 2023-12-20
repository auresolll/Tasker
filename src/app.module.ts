import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AppController } from './app/controllers/app.controller';
import { CoreModule } from './core/core.module';
import { environments } from './environments/environments';
import { FeaturesModule } from './features/features.module';
import { imageFileFilter, storage } from './shared/utils/file-upload.utils';
import { LoggerModule } from './shared/logging/logger.module';
import { WinstonLogLevel } from './shared/logging/logger.interface';

@Module({
  imports: [
    CoreModule,
    FeaturesModule,
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: async () => ({
        uri: environments.mongoUri,
      }),
    }),
    MulterModule.register({ storage: storage, fileFilter: imageFileFilter }),
    LoggerModule.forRootAsync(
      {
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          return {
            level: configService.get<WinstonLogLevel>('logger.level'),
            consoleLevel: configService.get<WinstonLogLevel>(
              'logger.consoleLevel',
            ),
            timestamp: configService.get<boolean>('logger.timestamp'),
            maxFiles: configService.get<string>('logger.maxFiles'),
            maxFileSize: configService.get<string>('logger.maxFileSize'),
            disableConsoleAtProd: configService.get<boolean>(
              'logger.disableConsoleAtProd',
            ),
            dir: configService.get<string>('logger.dir'),
            errorLogName: configService.get<string>('logger.errorLogName'),
            appLogName: configService.get<string>('logger.appLogName'),
          };
        },
        inject: [ConfigService],
      },
      true,
    ),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
