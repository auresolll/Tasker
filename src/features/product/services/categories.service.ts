import { forEach } from 'lodash';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from 'src/features/basket/schemas/order.schema';
import { User } from 'src/features/user/schemas/user.schema';
import { Categories } from '../schemas/categories.schema';
import { Rating } from '../schemas/rating.schema';
import { map, orderBy } from 'lodash';
import { Product } from '../schemas/product.schema';
import { getFieldIds } from 'src/shared/utils/get-ids';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Rating.name) private ratingModel: Model<Rating>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Categories.name) private categoriesModel: Model<Categories>,
  ) {}

  async getCategoriesWithProducts() {
    const categoriesMap = new Map();
    const categories = await this.categoriesModel.find();

    for await (const dataset of categories) {
      const products = await this.productModel
        .find({ categories: dataset._id })
        .limit(12);
      categoriesMap.set(dataset.id, {
        ...dataset.toObject(),
        products,
      });
    }

    return [...categoriesMap.values()];
  }
  getCategoriesBySlug(slug: string) {
    return this.categoriesModel.findOne({ slug: slug });
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

    return orderBy([...categoriesMap.values()], ['populate'], 'desc');
  }
}
