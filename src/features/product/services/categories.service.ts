import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Order } from "src/features/basket/schemas/order.schema";
import { User } from "src/features/user/schemas/user.schema";
import { Categories } from "../schemas/categories.schema";
import { Rating } from "../schemas/rating.schema";
import { orderBy } from "lodash";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Rating.name) private ratingModel: Model<Rating>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Categories.name) private categoriesModel: Model<Categories>
  ) {}

  getCategoriesBySlug(slug: string) {
    return this.categoriesModel.find({ slug: slug });
  }
  
  getPopulateCategories(orders: Order[], categories: Categories[]) {
    const categoriesMap = new Map();
    for (const category of categories) {
      categoriesMap.set(category.id, {
        ...category.toObject(),
        populate: 0,
      });
    }

    for (const order of orders) {
      const category = categoriesMap.get(String(order.product.categories));
      if (!category) continue;
      category.populate++;
    }

    return orderBy([...categoriesMap.values()], ["populate"], "desc");
  }
}
