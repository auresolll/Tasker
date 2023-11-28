import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CoreModule } from './core/core.module';
import { environments } from './environments/environments';
import { FeaturesModule } from './features/features.module';

@Module({
  imports: [
    FeaturesModule,
    CoreModule,
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(environments.mongoUri, {
      autoIndex: false,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
