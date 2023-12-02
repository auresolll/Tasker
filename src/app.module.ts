import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AppController } from './app/controllers/app.controller';
import { CoreModule } from './core/core.module';
import { environments } from './environments/environments';
import { FeaturesModule } from './features/features.module';
import { imageFileFilter, storage } from './shared/utils/file-upload.utils';

@Module({
  imports: [
    FeaturesModule,
    CoreModule,
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: async () => ({
        uri: environments.mongoUri,
      }),
    }),
    MulterModule.register({ storage: storage, fileFilter: imageFileFilter }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
