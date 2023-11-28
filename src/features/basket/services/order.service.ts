import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Moment } from "moment";
import { Model, Types } from "mongoose";
import { Order } from "src/features/basket/schemas/order.schema";
import { Product } from "src/features/product/schemas/product.schema";
import { getFieldIds } from "src/shared/utils/get-ids";

@Injectable()
export class OrderService {
  constructor(@InjectModel(Order.name) private orderModel: Model<Order>) {}
  getOrdersByDate(start: Moment | Date | string, end: Moment | Date | string) {
    return this.orderModel
      .find({
        createdAt: {
        $gt: start,
        $lt: end,
        },
      })
      .populate("user")
      .populate("product");
  }

  getOrdersByProduct(product: Product) {
    return this.orderModel.find({ product: product._id });
  }

  getOrdersByProductsId(ids: Types.ObjectId[]) {
    return this.orderModel.find({
      product: {
        $in: ids,
      },
    });
  }
}
