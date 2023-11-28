import {
    forwardRef,
    Inject,
    Logger,
    UseFilters,
    UseGuards,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import {
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ExceptionsFilter } from 'src/core/filter/exceptions.filter';
import { CurrentUser } from 'src/features/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/features/auth/guard/jwt-auth.guard';
import { User } from '../schemas/user.schema';
import { UserService } from '../services/user.service';
import { getSocketUser } from './../../../shared/utils/get-socket-user';
import { RolesGuard } from 'src/shared/utils/roles.guard';

@UsePipes(new ValidationPipe())
@UseFilters(new ExceptionsFilter())
@UseGuards(JwtAuthGuard, RolesGuard)
@WebSocketGateway()
export class UserGateway implements OnGatewayDisconnect, OnGatewayConnection {
    @WebSocketServer()
    server: Server;

    logger = new Logger(this.constructor.name);

    online = 0;

    constructor(
        @Inject(forwardRef(() => UserService)) private userService: UserService,
    ) {}

    handleConnection() {
        this.online++;
        console.log(this.online);
        
    }

    handleDisconnect(socket: Socket) {
        this.online--;
        const user = getSocketUser(socket);

        if (!user) {
            return;
        }
        return this.userService.unsubscribeSocket(socket, user);
    }

    @SubscribeMessage('user:subscribe')
    async subscribe(@ConnectedSocket() client: Socket, @CurrentUser() user: User) {
        return this.userService.subscribeSocket(client, user);
    }
}
