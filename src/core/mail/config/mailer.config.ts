import { MailerOptions } from '@nestjs-modules/mailer';
import { ConfigFactory } from 'code-config';
import { join } from 'path';
import { PATHS } from '../../../shared/constants/paths';

export interface MailerSchema {
    transport: MailerOptions['transport'];
    defaults: MailerOptions['defaults'];
}

const defaultValue = {
    transport: {
        host: 'smtp.gmail.com',
        secure: false,
        auth: {
            user: 'thinhlvps23580@fpt.edu.vn',
            pass: 'bhnrmggkrtolutgq',
        },
    },
    defaults: {
        from: '"No Reply" <thinhlvps23580@fpt.edu.vn>',
    },
};

export const mailerConfig = ConfigFactory.getConfig<MailerSchema>(
    join(PATHS.config, 'mailer.config.json'),
    defaultValue
);

mailerConfig.initPrettify();
