import { SecretsSchema } from './auth.config';

export const authConfigDefault: SecretsSchema = {
    facebook: {
        appId: 1234,
        appSecret: 'secret',
    },
    google: {
        appId: 1234,
        appSecret: 'secret',
    },
};
