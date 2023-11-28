import { blockFieldUser } from "./../../../shared/constants/blockField";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { max, orderBy } from "lodash";
import { FilterQuery, Model, Types } from "mongoose";
import { Order } from "src/features/basket/schemas/order.schema";
import { User } from "src/features/user/schemas/user.schema";
import { randomString } from "src/shared/utils/random-string";
import { Product } from "../schemas/product.schema";
import { Rating } from "../schemas/rating.schema";
import {
  ENUM_PROJECT_SORT,
  ResponsePaginationDto,
} from "./../../../shared/constants/pagination";
import { OrderService } from "./../../basket/services/order.service";
import { RatingService } from "./rating.service";

@Injectable()
export class ProductService {
  constructor(
    private readonly orderService: OrderService,
    private readonly ratingService: RatingService,

    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Order.name) private orderModel: Model<Order>
  ) {}

  async findProductById(id: Types.ObjectId) {
    return this.productModel
      .findById(id)
      .populate("creator", blockFieldUser)
      .populate("categories");
  }

  async findProductBySlug(slug: string) {
    return this.productModel
      .findOne({ slug: slug })
  }

  async validateProductId(id: Types.ObjectId) {
    const isProduct = await this.productModel.findById(id);
    if (!isProduct) throw new NotFoundException("Không tìm thấy sản phẩm");
    return isProduct;
  }

  async getProductsByFilter(
    limit: number,
    page: number,
    skip: number,
    filter?: FilterQuery<Product>
  ): Promise<ResponsePaginationDto<Product>> {
    const [products, count] = await Promise.all([
      this.productModel
        .find({
          ...filter,
          deletedAt: null,
        })
        .limit(limit)
        .skip(skip)
        .populate("creator", blockFieldUser)
        .populate("categories")
        .sort({ createdAt: -1 }),
      this.productModel.count(filter),
    ]);

    return {
      totalItem: count,
      totalPage: Math.ceil(count / limit),
      limit,
      currentPage: page,
      result: products,
    };
  }

  async getHotProducts(
    orders: Order[],
    products: Product[]
  ): Promise<Product[]> {
    const productsMap = new Map();
    for (const product of products) {
      productsMap.set(product.id, {
        ...product.toObject(),
        totalSeller: 0,
      });
    }

    for (const order of orders) {
      const product = productsMap.get(String(order.product));
      if (!product) continue;
      product.totalSeller++;
    }

    const result = [...productsMap.values()]
      .sort((a, b) => a["totalSeller"] - b["totalSeller"])
      .reverse();

    return result;
  }

  async getDetailProductById(id: Types.ObjectId) {
    const product = await this.findProductById(id);

    if (!product) throw new NotFoundException("Không tìm thấy sản phẩm");

    const result = {
      ...product.toObject(),
      rating: {
        count: 0,
        value: 0,
      },
    };

    const ratings = await this.ratingService.getRatingByProduct(product);

    for (const rating of ratings) {
      result.rating.count++;
      result.rating.value += rating.star;
    }

    result.rating.value /= result.rating.count;

    return result as unknown as Product;
  }

  create(body: Partial<Product>[]) {
    return this.productModel.insertMany(body);
  }

  async filterProductsAndSort(
    products: Product[],
    ratings: Rating[],
    sort: ENUM_PROJECT_SORT
  ) {
    const map = new Map();
    for (const product of products) {
      map.set(product.id, {
        ...product.toObject(),
        rating: {
          count: 0,
          value: 0,
        },
      });
    }

    for (let index = 0; index < ratings.length; index++) {
      const rating = ratings[index];
      const ratingRow = map.get(String(rating?.product));

      if (rating && ratingRow) {
        ratingRow.rating.count++;
        ratingRow.rating.value += rating.star;
      }
    }

    const result = [...map.values()];

    for (const product of result) {
      if (product.rating.count === 0) continue;
      product.rating.value /= product.rating.count;
    }

    return this.sortProducts(result, sort);
  }

  private sortProducts(products: Product[], sort: ENUM_PROJECT_SORT) {
    if (!sort) return products;
    const condition = {
      CREATED_DATE: products.sort(
        (a, b) => a["createdAt"].getTime() - b["createdAt"].getTime()
      ),

      CREATED_DATE_DESC: products
        .sort((a, b) => a["createdAt"].getTime() - b["createdAt"].getTime())
        .reverse(),

      PRICE: orderBy(products, ["price"], "asc"),

      PRICE_DESC: orderBy(products, ["price"], "desc"),

      RATING: orderBy(products, ["rating.value"], "asc"),

      RATING_DESC: orderBy(products, ["rating.value"], "desc"),

      BEST_SELLER: orderBy(products, ["numberHasSeller"], "asc"),

      BEST_SELLER_DESC: orderBy(products, ["numberHasSeller"], "desc"),
    };

    return condition[sort];
  }
}
