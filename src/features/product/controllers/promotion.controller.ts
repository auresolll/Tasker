import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { FilterQuery, Model, Types } from "mongoose";
import { CurrentUser } from "src/features/auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "src/features/auth/guard/jwt-auth.guard";
import { Transaction } from "src/features/transaction/schemas/transaction.schema";
import { User } from "src/features/user/schemas/user.schema";
import { PaginationDto } from "src/shared/constants/pagination";
import { ENUM_ROLE_TYPE, getAllRoles } from "src/shared/constants/role";
import { ParseObjectIdPipe } from "src/shared/pipe/parse-object-id.pipe";
import { randomString } from "src/shared/utils/random-string";
import { Roles } from "src/shared/utils/roles.decorator";
import { RolesGuard } from "src/shared/utils/roles.guard";
import { CreatePromotionDto } from "../dtos/create-promotion.dto";
import { Product } from "../schemas/product.schema";
import { Promotion } from "../schemas/promotions.schema";
import { ENUM_VOUCHER_TYPE, Voucher } from "../schemas/voucher.schema";
import { PromotionService } from "./../services/promotion.service";
import { getFieldIds } from "src/shared/utils/get-ids";

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("accessToken")
@Controller("promotion")
export class PromotionController {
  constructor(
    private promotionService: PromotionService,

    @InjectModel(Product.name) private ProductModel: Model<Product>,
    @InjectModel(Promotion.name) private PromotionModel: Model<Promotion>
  ) {}

  @ApiOperation({
    summary: "Get mã khuyến mãi (Người bán)",
  })
  @ApiTags("Private Promotions")
  @Roles(ENUM_ROLE_TYPE.SELLER)
  @Get("")
  async getPromotions(
    @CurrentUser() user: User,
    @Query() query: PaginationDto
  ) {
    const filter: FilterQuery<Promotion> = {
      user: user._id,
      deletedAt: null,
    };

    const [promotions, count] = await this.promotionService.getPromotions(
      filter,
      query.limit,
      query.getSkip()
    );

    return {
      currentPage: query.page,
      limit: query.limit,
      result: promotions,
      totalItem: count,
      totalPage: Math.ceil(count / query.limit),
    };
  }

  // @ApiOperation({
  //   summary: "Get mã khuyến mãi dự theo Code",
  // })
  // @ApiTags("Private Promotions")
  // @Roles(...getAllRoles())
  // @Get("code")
  // async getPromotionByCode(
  //   @CurrentUser() user: User,
  //   @Query("code") code: string
  // ) {
  //   const filter: FilterQuery<Promotion> = {
  //     code: code,
  //     deletedAt: null,
  //   };

  //   return this.PromotionModel.findOne(filter);
  // }

  @ApiOperation({
    summary: "Tạo mã khuyến mãi (Người bán)",
  })
  @ApiTags("Private Promotions")
  @Roles(ENUM_ROLE_TYPE.SELLER)
  @Post("")
  async createPromotions(
    @CurrentUser() user: User,
    @Body() body: CreatePromotionDto
  ) {
    body.setFieldsBasedOnEnum();

    const payload: Partial<Promotion> = {
      user: user._id,
      start_date: body.start_date,
      end_date: body.end_date,
      code: randomString(10).toLocaleUpperCase(),
      voucher: new Types.ObjectId(body.voucherID) as unknown as Voucher,
    };

    if (body.voucherID === ENUM_VOUCHER_TYPE.PRODUCT_DISCOUNT) {
      payload.discount = body.discount;
    }

    if (body.voucherID === ENUM_VOUCHER_TYPE.PREFERENTIAL_PRICE) {
      payload.discount = body.discount;
      payload.min_purchase_amount = body.min_purchase_amount;
    }

    if (body.voucherID === ENUM_VOUCHER_TYPE.VOUCHER) {
      payload.discount = body.discount;
    }

    if (body.voucherID === ENUM_VOUCHER_TYPE.GIFT) {
      const products = await this.ProductModel.find({
        _id: { $in: body.items },
      }).select("id");

      if (body.items.length !== products.length) {
        throw new BadRequestException(
          "Mã quà tặng khi mua hàng có sản phẩm không được tìm thấy"
        );
      }

      payload.items = body.items;
    }

    return this.PromotionModel.create(payload);
  }

  @ApiOperation({
    summary: "Delete mã khuyến mãi (Người bán)",
  })
  @ApiTags("Private Promotions")
  @Roles(ENUM_ROLE_TYPE.SELLER)
  @Delete("")
  async deletePromotion(
    @CurrentUser() user: User,
    @Query("promotionID", new ParseObjectIdPipe()) id: string
  ) {
    const filter: FilterQuery<Promotion> = {
      user: user._id,
      id: new Types.ObjectId(id),
    };
    return this.PromotionModel.findOneAndUpdate(filter, { deletedAt: null });
  }
}
