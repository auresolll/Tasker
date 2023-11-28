import {
    HttpException,
    HttpStatus,
    UseFilters,
    UseGuards,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import {
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Types } from 'mongoose';
import { Server } from 'socket.io';
import { CurrentUser } from 'src/features/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/features/auth/guard/jwt-auth.guard';
import { User } from 'src/features/user/schemas/user.schema';
import { getAllRoles } from 'src/shared/constants/role';
import { Roles } from 'src/shared/utils/roles.decorator';
import { RolesGuard } from 'src/shared/utils/roles.guard';
import { DirectMessageDto } from '../dtos/direct-message.dto';
import { TypedEventMessages } from '../interfaces/typed-event.interface';
import { MessageService } from '../services/messages.service';
import { ExceptionsFilter } from './../../../core/filter/exceptions.filter';
import { ParseObjectIdPipe } from './../../../shared/pipe/parse-object-id.pipe';
import { UserService } from './../../user/services/user.service';

@UsePipes(new ValidationPipe())
@UseFilters(new ExceptionsFilter())
@UseGuards(...[JwtAuthGuard, RolesGuard])
@WebSocketGateway()
export class MessagesGateway implements TypedEventMessages {
    @WebSocketServer() server: Server;

    constructor(
        private readonly messageService: MessageService,
        private userService: UserService,
    ) {}

    @Roles(...getAllRoles())
    @SubscribeMessage('message:direct')
    async sendDirectMessage(
        @MessageBody() body: DirectMessageDto,
        @CurrentUser() user: User,
    ) {
        const userTo = await this.userService
            .validateUserById(new Types.ObjectId(body.to))
            .catch(() => {
                throw new HttpException('Invalid userId', HttpStatus.BAD_REQUEST);
            });

        const message = await this.messageService.createDirectMessage(
            user,
            userTo,
            body.content,
            body.type,
        );

        this.userService.sendMessage(user, 'message:direct', message);
        this.userService.sendMessage(userTo, 'message:direct', message);

        return true;
    }

    @Roles(...getAllRoles())
    @SubscribeMessage('message:direct:typing')
    async sendDirectTyping(
        @MessageBody('to', new ParseObjectIdPipe()) to: Types.ObjectId,
        @CurrentUser() user: User,
    ) {
        const userTo = await this.userService.validateUserById(to);
        return this.userService.sendMessage(userTo, 'message:direct:typing', {
            user: this.userService.filterUser(user),
            typing: true,
        });
    }
}
