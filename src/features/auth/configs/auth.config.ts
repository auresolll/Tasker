import { join } from 'path';
import { PATHS } from '../../../shared/constants/paths';
import { authConfigDefault } from './auth-config.default';
import { ConfigFactory } from 'code-config';

interface Secret {
    appId: number | string;
    appSecret: string;
}

interface Platform {
    clientId: string;
    redirectUri: string;
    packageId?: string;
}

export interface SecretsSchema {
    facebook: Secret;
    google: Secret;
}

export const authConfig = ConfigFactory.getConfig<SecretsSchema>(
    join(PATHS.config, 'auth.config.json'),
    authConfigDefault
);

authConfig.initPrettify();
