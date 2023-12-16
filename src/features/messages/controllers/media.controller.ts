import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { CurrentUser } from 'src/features/auth/decorators/current-user.decorator';
import { User } from 'src/features/user/schemas/user.schema';
import { getAllRoles } from 'src/shared/constants/role';
import { ParseObjectIdPipe } from 'src/shared/pipe/parse-object-id.pipe';
import { Roles } from 'src/shared/utils/roles.decorator';
import { RolesGuard } from 'src/shared/utils/roles.guard';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { FetchMediaDto } from '../dtos/fetch-media.dto';
import { UserService } from './../../user/services/user.service';
import { MediaService } from './../services/media.service';
import { CreateMediaDto } from '../dtos/create-media.dto';

@ApiTags('Media')
@UseGuards(...[JwtAuthGuard, RolesGuard])
@ApiBearerAuth('accessToken')
@Controller('media')
export class MediaController {
  constructor(
    private mediaService: MediaService,
    private userService: UserService,
  ) {}

  @Roles(...getAllRoles())
  @Get('direct-media')
  async getDirectMedia(
    @CurrentUser() user: User,
    @Query('to', new ParseObjectIdPipe()) to: string,
    @Query() query: FetchMediaDto,
  ) {
    const userTo = await this.userService.validateUserById(
      new Types.ObjectId(to),
    );

    return this.mediaService.getDirectMedia(
      user,
      userTo,
      query.limit,
      query.before,
    );
  }

  @Roles(...getAllRoles())
  @Post('create-media')
  async CreateMedia(
    @CurrentUser() user: User,
    @Query('to', new ParseObjectIdPipe()) to: string,
    @Query() Query: CreateMediaDto,
  ) {
    const { fileName, url, type } = Query;
    const userTo = await this.userService.validateUserById(
      new Types.ObjectId(to),
    );

    return this.mediaService.create(user, userTo, fileName, url, type);
  }
}
