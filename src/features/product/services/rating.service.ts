import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Order } from "src/features/basket/schemas/order.schema";
import { User } from "src/features/user/schemas/user.schema";
import { Rating } from "../schemas/rating.schema";
import { Product } from "../schemas/product.schema";

@Injectable()
export class RatingService  {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Rating.name) private ratingModel: Model<Rating>,
    @InjectModel(Order.name) private orderModel: Model<Order>
  ) {}

  async create(body: Partial<Rating>): Promise<Rating> {
    return this.ratingModel.create(body);
  }
  
  getRatingByProduct(product: Product) {
    return this.ratingModel.find({
      product: product._id,
    });
  }

  getRatingByProductsId(ids: Types.ObjectId[]) {
    return this.ratingModel.find({
      product: {
        $in: ids,
      },
    });
  }
}
