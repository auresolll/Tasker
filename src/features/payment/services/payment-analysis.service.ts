import { User } from '../../user/schemas/user.schema';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { blockFieldUser } from 'src/shared/constants/blockField';
import {
  ENUM_TRANSACTION_STATUS,
  ENUM_TRANSACTION_TYPE,
  Transaction,
} from '../schemas/transaction.schema';
import * as moment from 'moment';
import { Order } from 'src/features/basket/schemas/order.schema';
import { Product } from 'src/features/product/schemas/product.schema';
import { getFieldIds } from 'src/shared/utils/get-ids';

@Injectable()
export class PaymentAnalysisService {
  constructor(
    @InjectModel(Transaction.name) private TransactionModel: Model<Transaction>,
    @InjectModel(User.name) private UserModel: Model<User>,
    @InjectModel(Order.name) private OrderModel: Model<Order>,
    @InjectModel(Product.name) private ProductModel: Model<Product>,
  ) {}

  async statisticalOverview(start_date: Date, end_date: Date) {
    const filter = {
      createdAt: {
        $gte: start_date,
        $lte: end_date,
      },
    };
    const result = {
      totalRevenue: 0,
      totalProfit: 0,
      countOrders: 0,
      countProjects: 0,
    };

    const percentage = 5;
    const [orders, products] = await Promise.all([
      this.OrderModel.find(filter),
      this.ProductModel.find(),
    ]);
    result.countOrders = orders.length;
    result.countProjects = products.length;
    orders.forEach((dataset) => {
      result.totalRevenue += dataset.totalPrice;
      result.totalProfit += dataset.totalPrice;
    });
    result.totalProfit = (percentage / 100) * result.totalProfit;

    return result;
  }

  async statisticalOverviewByUser(
    user: User,
    start_date: Date,
    end_date: Date,
  ) {
    const result = {
      totalRevenue: 0,
      totalProfit: 0,
      countOrders: 0,
      countProducts: 0,
    };

    const percentage = 5;
    const ownProducts = await this.ProductModel.find({ creator: user._id });

    const filter = {
      createdAt: {
        $gte: start_date,
        $lte: end_date,
      },
      product: { $in: getFieldIds(ownProducts) },
    };

    const orders = await this.OrderModel.find(filter);

    result.countOrders = orders.length;
    result.countProducts = ownProducts.length;
    orders.forEach((dataset) => {
      result.totalRevenue += dataset.totalPrice;
      result.totalProfit += dataset.totalPrice;
    });
    result.totalProfit = (percentage / 100) * result.totalProfit;

    return result;
  }
}
