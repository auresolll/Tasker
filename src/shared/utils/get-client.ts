import { ExecutionContext } from '@nestjs/common';
import { User } from '../../features/user/schemas/user.schema';
import { Dictionary } from 'code-config';

export interface Client {
    headers: Dictionary<string>;
    user: User;
}

export const getClient = <T = Client>(ctx: ExecutionContext): T => {
    switch (ctx.getType()) {
        case 'ws':
            return ctx.switchToWs().getClient().handshake;
        case 'http':
            return ctx.switchToHttp().getRequest();
        default:
            return undefined;
    }
};
