import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { getAllRoles } from 'src/shared/constants/role';
import { ParseObjectIdPipe } from 'src/shared/pipe/parse-object-id.pipe';
import { RolesGuard } from 'src/shared/utils/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import {
  FetchMessagesDto,
  ResponseGetDirectMessagesDto,
  ResponseGetFirstDirectMessageDto,
  ResponseRecallMessageDto,
} from '../dtos/fetch-messages.dto';
import { MessageService } from '../services/messages.service';
import { Roles } from './../../../shared/utils/roles.decorator';
import { User } from './../../user/schemas/user.schema';
import { UserService } from './../../user/services/user.service';

@ApiTags('Message')
@UseGuards(...[JwtAuthGuard, RolesGuard])
@ApiBearerAuth('accessToken')
@Controller('message')
export class MessageController {
  constructor(
    private userService: UserService,
    private messageService: MessageService,
  ) {}

  @Roles(...getAllRoles())
  @ApiOperation({ summary: 'Get thông tin người đã chat cùng mình' })
  @Get('info-users-chat')
  getInfoUserChat(@CurrentUser() user: User) {
    return this.messageService.getInfoUserChat(user);
  }

  @Roles(...getAllRoles())
  @ApiOperation({ summary: 'API to get new first message' })
  @ApiResponse({
    status: 200,
    description: 'The message record',
    type: ResponseGetFirstDirectMessageDto,
  })
  @Get('direct-first-message/:userId')
  async getFirstDirectMessage(
    @CurrentUser() user: User,
    @Param('userId', new ParseObjectIdPipe()) to: string,
  ) {
    const userTo = await this.userService.validateUserById(
      new Types.ObjectId(to),
    );
    const message = await this.messageService.getFirstDirectMessage(
      user,
      userTo,
    );
    if (!message) return null;
    return this.messageService.filterMessage([message])[0];
  }

  @Roles(...getAllRoles())
  @Get('direct/:userId')
  @ApiOperation({ summary: 'API to get list messages' })
  @ApiResponse({
    status: 200,
    description: 'The message records',
    type: ResponseGetDirectMessagesDto,
    isArray: true,
  })
  async getDirectMessages(
    @CurrentUser() user: User,
    @Param('userId', new ParseObjectIdPipe()) to: string,
    @Query() query: FetchMessagesDto,
  ) {
    const userTo = await this.userService.validateUserById(
      new Types.ObjectId(to),
    );
    return this.messageService.filterMessage(
      await this.messageService.getDirectMessages(
        user,
        userTo,
        query.limit,
        query.before,
      ),
    );
  }

  @Delete('recall/:messageId')
  @ApiOperation({ summary: 'API to recall a message' })
  @ApiResponse({
    status: 200,
    description: 'The message record',
    type: ResponseRecallMessageDto,
  })
  async recall(
    @CurrentUser() user: User,
    @Query('messageId', new ParseObjectIdPipe()) message: string,
  ) {
    return this.messageService.recall(user, new Types.ObjectId(message));
  }
}
