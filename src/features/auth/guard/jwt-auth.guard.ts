import {
    CanActivate,
    ContextType,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    UnauthorizedException,
    forwardRef,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { Socket } from 'socket.io';
import { UserService } from 'src/features/user/services/user.service';
import { Client, getClient } from '../../../shared/utils/get-client';
import { AUTH_NOT_REQUIRED } from '../decorators/auth-not-required.decorator';
import { AuthService } from '../services/auth.service';

export interface Token {
    sub: Types.ObjectId;
    email: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
    reflector: Reflector;

    constructor(
        private authService: AuthService,
        private jwtService: JwtService,
        @Inject(forwardRef(() => UserService)) private userService: UserService,
    ) {
        this.reflector = new Reflector();
    }

    async canActivate(ctx: ExecutionContext): Promise<boolean> {
        const client = this.getRequest(ctx);

        const allowAny = this.reflector.get<boolean>(AUTH_NOT_REQUIRED, ctx.getHandler());

        try {
            client.user = await this.handleRequest(ctx, client);
        } catch (e) {
            if (allowAny) {
                return true;
            }

            throw e;
        }

        return client.user != null;
    }

    private getToken(ctx: ExecutionContext, client: Client, type: ContextType) {
        switch (type) {
            case 'http':
                return this.getTokenHttp(ctx, client);
            case 'ws':
                return this.getTokenWs(ctx, client);
        }
    }
    private async handleRequest(ctx: ExecutionContext, client: Client) {
        try {
            let token: string = this.getToken(ctx, client, ctx.getType());

            const decoded = this.jwtService.decode(token) as Token;

            if (!decoded) this.throwException(ctx, 'Không thể giải mã token');
            const user = await this.validate(decoded);

            await this.jwtService.verifyAsync<Token>(
                token,
                this.authService.getAccessTokenOptions(user),
            );

            return user;
        } catch (e) {
            this.throwException(ctx, 'Token không hợp lệ');
        }
    }

    private validate({ sub }: Token) {
        return this.userService.validateUserById(sub);
    }

    private getTokenHttp(ctx: ExecutionContext, client: Client): string {
        const authorization = client.headers.authorization?.split(' ');
        this.validateAuthorization(ctx, authorization);
        return authorization[1];
    }

    private validateAuthorization(ctx: ExecutionContext, authorization: string[]) {
        if (!authorization) {
            this.throwException(ctx, 'Không tìm thấy token');
        }

        if (authorization[0].toLowerCase() !== 'bearer') {
            this.throwException(ctx, 'Authorization phải bắt đầu với Bearer');
        }

        if (!authorization[1]) {
            this.throwException(ctx, 'Token không được cung cấp');
        }
    }
    private getTokenWs(ctx: ExecutionContext, client: Client): string {
        const authorization = ctx
            .switchToWs()
            .getClient<Socket>()
            .handshake.headers.authorization?.split(' ');
        this.validateAuthorization(ctx, authorization);
        return authorization[1];
    }

    throwException(ctx: ExecutionContext, message: string) {
        if (ctx.getType() === 'ws') {
            ctx.switchToWs().getClient<Socket>().disconnect(true);
        }

        throw new UnauthorizedException(message);
    }

    private getRequest(ctx: ExecutionContext) {
        return getClient(ctx);
    }
}
