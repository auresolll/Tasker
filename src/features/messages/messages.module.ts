import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { MediaController } from './controllers/media.controller';
import { MessageController } from './controllers/messages.controller';
import { MessagesGateway } from './gateways/messages.gateway';
import { Message, MessageSchema } from './schemas/messages.schema';
import { MediaService } from './services/media.service';
import { MessageService } from './services/messages.service';
import { Media, MediaSchema } from './schemas/media.schema';
import { Models } from 'src/shared/constants/model';

@Module({
    imports: [
        Models,
        UserModule,
        AuthModule,
    ],
    controllers: [MessageController, MediaController],
    providers: [MessagesGateway, MessageService, MediaService],
})
export class MessagesModule {}
