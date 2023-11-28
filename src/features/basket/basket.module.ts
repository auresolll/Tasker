import { Module, forwardRef } from "@nestjs/common";
import { OrderController } from "./controllers/order.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module";
import {
  Categories,
  CategoriesSchema,
} from "../product/schemas/categories.schema";
import { Product, ProductSchema } from "../product/schemas/product.schema";
import { Rating, RatingSchema } from "../product/schemas/rating.schema";
import { User, UserSchema } from "../user/schemas/user.schema";
import { Order, OrderSchema } from "./schemas/order.schema";
import { ProductModule } from "../product/product.module";
import { OrderService } from "./services/order.service";
import { Models } from "src/shared/constants/model";

@Module({
  imports: [
    Models,
    forwardRef(() => AuthModule),
    forwardRef(() => ProductModule),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class BasketModule {}
