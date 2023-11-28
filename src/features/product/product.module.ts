import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module";
import { BasketModule } from "../basket/basket.module";
import { Order, OrderSchema } from "../basket/schemas/order.schema";
import { User, UserSchema } from "../user/schemas/user.schema";
import { CategoriesController } from "./controllers/categories.controller";
import { CommentController } from "./controllers/comment.controller";
import { ProductController } from "./controllers/product.controller";
import { RatingController } from "./controllers/rating.controller";
import { Categories, CategoriesSchema } from "./schemas/categories.schema";
import { Comment, CommentSchema } from "./schemas/comment.schema";
import { Product, ProductSchema } from "./schemas/product.schema";
import { Rating, RatingSchema } from "./schemas/rating.schema";
import { CategoriesService } from "./services/categories.service";
import { CommentService } from "./services/comment.service";
import { ProductService } from "./services/product.service";
import { RatingService } from "./services/rating.service";
import { Models } from "src/shared/constants/model";
import { PromotionController } from "./controllers/promotion.controller";
import { PromotionService } from "./services/promotion.service";
import { VoucherController } from "./controllers/voucher.controller";

@Module({
  imports: [
    Models,
    forwardRef(() => AuthModule),
    forwardRef(() => BasketModule),
  ],
  controllers: [
    ProductController,
    CategoriesController,
    CommentController,
    RatingController,
    PromotionController,
    VoucherController
  ],
  providers: [
    ProductService,
    CommentService,
    CategoriesService,
    RatingService,
    PromotionService,
  ],
  exports: [
    ProductService,
    CommentService,
    CategoriesService,
    RatingService,
    PromotionService,
  ],
})
export class ProductModule {}
