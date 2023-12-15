import {
  BadGatewayException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as moment from 'moment';
import { FilterQuery, Model, Types } from 'mongoose';
import { CurrentUser } from 'src/features/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/features/auth/guard/jwt-auth.guard';
import { Product } from 'src/features/product/schemas/product.schema';
import { User } from 'src/features/user/schemas/user.schema';
import { blockFieldUser } from 'src/shared/constants/blockField';
import {
  PaginationDto,
  ResponsePaginationDto,
} from 'src/shared/constants/pagination';
import { ENUM_ROLE_TYPE } from 'src/shared/constants/role';
import { getFieldIds } from 'src/shared/utils/get-ids';
import { RolesGuard } from 'src/shared/utils/roles.guard';
import { Roles } from '../../../shared/utils/roles.decorator';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { FetchOrdersByStatus } from '../dtos/fetch-orders-by-status.dto';
import { ENUM_ORDER_STATUS, Order } from '../schemas/order.schema';
import { Promotion } from 'src/features/product/schemas/promotions.schema';
import { ParseObjectIdPipe } from 'src/shared/pipe/parse-object-id.pipe';
import { AuthNotRequired } from 'src/features/auth/decorators/auth-not-required.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('accessToken')
@Controller('order')
export class OrderController {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Promotion.name) private PromotionModel: Model<Promotion>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  @ApiOperation({
    summary: 'Lịch sử  đơn hàng đã mua Admin',
  })
  @ApiTags('Private Order')
  @Roles(ENUM_ROLE_TYPE.ADMINISTRATION)
  @Get(`all-orders`)
  @ApiOperation({
    summary: 'Lịch sử  đơn hàng đã mua',
  })
  async getAllOrders(
    @Query() query: PaginationDto,
  ): Promise<ResponsePaginationDto<Order>> {
    const filter: FilterQuery<Order> = {
      createdAt: {
        $lt: moment(query.before),
      },
    };

    if (!query.before) delete filter.createdAt;

    const orders = await this.orderModel
      .find(filter)
      .populate({
        path: 'product',
        populate: {
          path: 'categories',
          model: 'Categories',
        },
      })
      .populate({
        path: 'product',
        populate: {
          path: 'creator',
          model: 'User',
          select: blockFieldUser,
        },
      })
      .populate('user', blockFieldUser)
      .limit(query.limit)
      .skip(query.getSkip());

    const count = await this.orderModel.count();
    return {
      totalItem: count,
      totalPage: Math.ceil(count / query.limit),
      limit: query.limit,
      currentPage: query.page,
      result: orders,
    };
  }

  @ApiTags('Private Order')
  @Roles(ENUM_ROLE_TYPE.CUSTOMER)
  @Get(`histories`)
  async getHistoriesOrders(
    @CurrentUser() user: User,
    @Query() query: PaginationDto,
  ) {
    const filter: FilterQuery<Order> = {
      user: user._id,
      createdAt: {
        $lt: moment(query.before),
      },
    };

    if (!query.before) delete filter['createdAt'];

    const orders = await this.orderModel
      .find(filter)
      .populate({
        path: 'product',
        populate: {
          path: 'categories',
          model: 'Categories',
        },
      })
      .populate({
        path: 'product',
        populate: {
          path: 'creator',
          model: 'User',
          select: blockFieldUser,
        },
      })
      .populate('user', blockFieldUser)
      .limit(query.limit)
      .skip(query.getSkip());

    return orders;
  }

  @ApiOperation({
    summary: 'Tạo đơn hàng',
  })
  @ApiTags('Private Order')
  @Roles(ENUM_ROLE_TYPE.CUSTOMER)
  @Post('')
  async createOrder(@CurrentUser() user: User, @Body() body: CreateOrderDto) {
    const product = await this.productModel.findById(body.productID);
    const promotion = await this.PromotionModel.findById(body.promotionID);

    if (!product) throw new NotFoundException('PRODUCT NOT FOUND');

    if (product.quantity - body.quantity <= 0)
      throw new BadGatewayException('Số lượng không đủ để order');

    const originalPrice = body.orderPrice * body.quantity;

    const payload: Partial<Order> = {
      ...body,
      user: user._id,
      product: product._id,
      promotion: promotion ? promotion._id : null,
      status: ENUM_ORDER_STATUS.FAILED,
      totalPrice:
        originalPrice - (originalPrice * promotion.discount || 0 / 100),
    };

    product.numberHasSeller++;
    product.quantity -= body.quantity;
    const created = await this.orderModel
      .create(payload)
      .then(async (response) => {
        await product.save();
        return response;
      });
    return created;
  }

  @ApiOperation({
    summary: 'Cập nhật trạng thái đơn hàng',
  })
  @ApiTags('Private Order')
  @Roles(ENUM_ROLE_TYPE.CUSTOMER)
  @Patch('')
  async updateStatusOrder(
    @CurrentUser() user: User,
    @Query('orderID', new ParseObjectIdPipe()) id: string,
  ) {
    const order = await this.orderModel.findById({ _id: id, user: user._id });
    order.status = ENUM_ORDER_STATUS.SUCCESSFULLY;
    return order.save();
  }

  @ApiOperation({
    summary: 'Get tất cả đơn hàng (Người bán)',
  })
  @ApiTags('Private Order')
  @Roles(ENUM_ROLE_TYPE.SELLER)
  @Get('histories-order-seller')
  async getHistoriesOrderForSeller(
    @CurrentUser() user: User,
    @Query() query: PaginationDto,
  ) {
    const products = await this.productModel.find({ creator: user._id });
    const [orders, count] = await Promise.all([
      this.orderModel
        .find({
          product: { $in: getFieldIds(products) },
        })
        .limit(query.limit)
        .skip(query.getSkip())
        .sort({ createdAt: -1 }),
      this.orderModel.count({
        product: { $in: getFieldIds(products) },
      }),
    ]);

    return {
      currentPage: query.page,
      limit: query.limit,
      result: orders,
      totalItem: count,
      totalPage: Math.ceil(count / query.limit),
    };
  }

  @ApiOperation({
    summary: 'Get tất cả đơn hàng theo trạng thái (Người bán)',
  })
  @ApiTags('Private Order')
  @Roles(ENUM_ROLE_TYPE.SELLER)
  @Get('histories-order-by-status')
  async getOrdersByStatus(
    @CurrentUser() user: User,
    @Query() query: FetchOrdersByStatus,
  ) {
    const products = await this.productModel.find({ creator: user._id });
    const filter: FilterQuery<Order> = {
      product: { $in: getFieldIds(products) },
      status: query.status,
    };
    const [orders, count] = await Promise.all([
      this.orderModel
        .find(filter)
        .limit(query.limit)
        .skip(query.getSkip())
        .sort({ createdAt: -1 }),
      this.orderModel.count(filter),
    ]);

    return {
      currentPage: query.page,
      limit: query.limit,
      result: orders,
      totalItem: count,
      totalPage: Math.ceil(count / query.limit),
    };
  }

  @ApiOperation({
    summary: 'Get tất cả đơn hàng theo user (Admin)',
  })
  @ApiTags('Private Order')
  @Roles(ENUM_ROLE_TYPE.ADMINISTRATION)
  @Get('histories-order-by-user')
  async getOrderByUser(
    @Query('customer_id', new ParseObjectIdPipe()) customer_id: string,
    @Query() query: PaginationDto,
  ) {
    return this.orderModel
      .find({
        user: new Types.ObjectId(customer_id),
      })
      .populate('product')
      .limit(query.limit)
      .skip(query.getSkip())
      .sort({ createdAt: -1 });
  }
}
