import {
  BadGatewayException,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Model, Types } from 'mongoose';
import { AuthNotRequired } from 'src/features/auth/decorators/auth-not-required.decorator';
import { OrderService } from 'src/features/basket/services/order.service';
import { Product } from 'src/features/product/schemas/product.schema';
import { ENUM_ROLE_TYPE, getAllRoles } from 'src/shared/constants/role';
import { getFieldIds } from 'src/shared/utils/get-ids';
import { RolesGuard } from 'src/shared/utils/roles.guard';
import { Follow } from '../schemas/follow.schema';
import { User } from '../schemas/user.schema';
import { UserService } from '../services/user.service';
import { ParseObjectIdPipe } from './../../../shared/pipe/parse-object-id.pipe';
import { Roles } from './../../../shared/utils/roles.decorator';
import { JwtAuthGuard } from './../../auth/guard/jwt-auth.guard';
import { RatingService } from './../../product/services/rating.service';
import { CurrentUser } from 'src/features/auth/decorators/current-user.decorator';
import { UpdateRoleDto } from '../dtos/update-role.dto';

@Controller('user')
@ApiBearerAuth('accessToken')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(
    private userService: UserService,
    private ratingService: RatingService,
    private orderService: OrderService,

    @InjectModel(User.name) private UserModel: Model<User>,
    @InjectModel(Product.name) private ProductModel: Model<Product>,
    @InjectModel(Follow.name) private FollowModel: Model<Follow>,
  ) {}

  @ApiTags('Private User')
  @Roles(...getAllRoles())
  @Get(':userId')
  async getUser(@Param('userId', new ParseObjectIdPipe()) id: string) {
    return this.userService.filterUser(
      await this.userService.validateUserById(new Types.ObjectId(id)),
    );
  }

  @ApiTags('Public User')
  @Get('')
  @AuthNotRequired()
  async getAllUsers() {
    return await this.userService.getUsers();
  }

  @ApiTags('Public User')
  @AuthNotRequired()
  @Get('seller/:userId')
  async getUserSeller(@Param('userId', new ParseObjectIdPipe()) id: string) {
    const user = await this.UserModel.findById(id);

    const requiredRole = ENUM_ROLE_TYPE.SELLER;
    if (String(user.role) !== requiredRole)
      throw new BadGatewayException('Người dùng không phải người bán');

    const totalProducts = await this.ProductModel.find({ creator: user._id });

    const [totalProductsSold, totalRatings, follower, following] =
      await Promise.all([
        this.orderService.getOrdersByProductsId(getFieldIds(totalProducts)),
        this.ratingService.getRatingByProductsId(getFieldIds(totalProducts)),
        this.FollowModel.count({ follower: user._id }),
        this.FollowModel.count({ following: user._id }),
      ]);

    const totalFollowOverall = {
      following: following,
      follower: follower,
    };

    const totalRatingsOverall = {
      value: 0,
      count: 0,
    };

    totalRatings.forEach((element) => {
      totalRatingsOverall.count++;
      totalRatingsOverall.value += element.star;
    });

    return {
      ...this.userService.filterUser(user),
      productsOverall: {
        totalProducts: totalProducts.length,
        totalProductsSold: totalProductsSold.length,
      },
      followOverall: totalFollowOverall,
      totalRatingsOfSeller:
        (totalRatingsOverall.value /= totalRatingsOverall.count) || 0,
    };
  }

  @ApiTags('Private User')
  @AuthNotRequired()
  @Patch('update-role')
  updateRole(@Query() query: UpdateRoleDto) {
    return this.UserModel.findByIdAndUpdate(query.userID, {
      role: new Types.ObjectId(query.role),
    });
  }

  @Roles(ENUM_ROLE_TYPE.ADMINISTRATION)
  @Delete('banned-user')
  @ApiTags('Private User')
  delete(
    @Query('userId', new ParseObjectIdPipe()) id: string,
    @Query('status') status: string,
  ) {
    const isTrueSet = /^true$/i.test(status);
    if (isTrueSet) {
      return this.UserModel.findByIdAndUpdate(id, { deletedAt: new Date() });
    }
    return this.UserModel.findByIdAndUpdate(id, { deletedAt: null });
  }

  @ApiTags('Private Setting')
  @Roles(ENUM_ROLE_TYPE.SELLER)
  @Patch('bank')
  updateBank(@CurrentUser() user: User, @Query('bank') bank: string) {
    return this.UserModel.findByIdAndUpdate(user._id, { bank });
  }

  @ApiTags('Private Setting')
  @Roles(ENUM_ROLE_TYPE.SELLER)
  @Delete('bank')
  deleteBank(@CurrentUser() user: User) {
    return this.UserModel.findByIdAndUpdate(user._id, { bank: null });
  }
}
