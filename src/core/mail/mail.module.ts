import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { mailerConfig } from './config/mailer.config';

@Module({
    imports: [
        MailerModule.forRoot({
            ...mailerConfig.toObject(),
            template: {
                dir: join(__dirname, '../../../templates'),
                adapter: new HandlebarsAdapter(),
                options: {
                    strict: true,
                },
            },
        }),
    ],
    controllers: [],
    providers: [],
})
export class MailModule {}
