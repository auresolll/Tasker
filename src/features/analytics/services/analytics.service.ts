import { Injectable } from "@nestjs/common";
import { CreateAnalyticsDto } from "../dtos/create-analytics.dto";
import { UpdateAnalyticsDto } from "../dtos/update-analytics.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "src/features/user/schemas/user.schema";
import { Product } from "src/features/product/schemas/product.schema";
import * as lodash from "lodash";
import { Order } from "src/features/basket/schemas/order.schema";
import { getFieldIds } from "src/shared/utils/get-ids";
import { environments } from "src/environments/environments";
@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<User>,
    @InjectModel(Order.name) private OrderModel: Model<Order>,
    @InjectModel(Product.name) private ProductModel: Model<Product>
  ) {}

  async getDashboardOverviewSeller(user: User) {
    const result = {
      totalProducts: 0,
      totalRevenue: 0,
      totalProfit: 0,
    };

    const products = await this.ProductModel.find({
      creator: user._id,
      deletedAt: null,
    });
    const orders = await this.OrderModel.find({
      product: { $in: getFieldIds(products) },
    });
    result.totalProducts = products.length;

    lodash.map(orders, (element) => {
      const totalSellingPrice = element.orderPrice * element.quantity;
      result.totalRevenue += totalSellingPrice;
    });

    const TAX = environments.tax;
    result.totalProfit = result.totalRevenue * ((100 - TAX) / 100);
    return result;
  }

  create(createAnalyticsDto: CreateAnalyticsDto) {
    return "This action adds a new analytics";
  }

  findAll() {
    return `This action returns all analytics`;
  }

  findOne(id: number) {
    return `This action returns a #${id} analytics`;
  }

  update(id: number, updateAnalyticsDto: UpdateAnalyticsDto) {
    return `This action updates a #${id} analytics`;
  }

  remove(id: number) {
    return `This action removes a #${id} analytics`;
  }
}
