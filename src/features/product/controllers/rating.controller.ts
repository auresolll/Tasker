import { Body, Controller, Post, Query, UseGuards } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Model, Types } from "mongoose";
import { CurrentUser } from "src/features/auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "src/features/auth/guard/jwt-auth.guard";
import { User } from "src/features/user/schemas/user.schema";
import { ENUM_ROLE_TYPE } from "src/shared/constants/role";
import { RolesGuard } from "src/shared/utils/roles.guard";
import { CreateRatingDto } from "../dtos/create-rating.dto";
import { Categories } from "../schemas/categories.schema";
import { Roles } from "./../../../shared/utils/roles.decorator";
import { Order } from "./../../basket/schemas/order.schema";
import { Rating } from "./../schemas/rating.schema";
import { ProductService } from "../services/product.service";
import { RatingService } from "../services/rating.service";
import { AuthNotRequired } from "src/features/auth/decorators/auth-not-required.decorator";

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("accessToken")
@Controller("rating")
export class RatingController {
  constructor(
    private readonly productService: ProductService,
    private readonly ratingService: RatingService,
    @InjectModel(Categories.name) private categoriesModel: Model<Categories>,
    @InjectModel(Order.name) private orderModel: Model<Order>
  ) {}

  @ApiOperation({
    summary: "Đánh giá sảm phẩm",
  })
  @ApiTags("Private Rating")
  // @Roles(ENUM_ROLE_TYPE.CUSTOMER, ENUM_ROLE_TYPE.SELLER)
  @AuthNotRequired()
  @Post("")
  async createRatingForProduct(
    @CurrentUser() user: User,
    @Body() body: CreateRatingDto  
  ) {
    const payload: Partial<Rating> = {
      user,
      product: await this.productService.validateProductId(
        new Types.ObjectId(body.productId)
      ),
      star: body.star,
    };

    return this.ratingService.create(payload);
  }
}
