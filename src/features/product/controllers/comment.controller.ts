import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { FilterQuery, Model, Types } from "mongoose";
import { AuthNotRequired } from "src/features/auth/decorators/auth-not-required.decorator";
import { CurrentUser } from "src/features/auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "src/features/auth/guard/jwt-auth.guard";
import { User } from "src/features/user/schemas/user.schema";
import { ENUM_ROLE_TYPE } from "src/shared/constants/role";
import { ParseObjectIdPipe } from "src/shared/pipe/parse-object-id.pipe";
import { Roles } from "src/shared/utils/roles.decorator";
import { RolesGuard } from "src/shared/utils/roles.guard";
import { CreateCommentDto } from "../dtos/create-comment.dto";
import { Categories } from "../schemas/categories.schema";
import { CommentService } from "../services/comment.service";
import { PaginationDto } from "./../../../shared/constants/pagination";
import { Order } from "./../../basket/schemas/order.schema";
import { Comment, ENUM_COMMENT_TYPE } from "./../schemas/comment.schema";
import { ProductService } from "../services/product.service";
import * as lodash from "lodash";

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("accessToken")
@Controller("comment")
export class CommentController {
  constructor(
    private productService: ProductService,
    private commentService: CommentService,

    @InjectModel(Categories.name) private categoriesModel: Model<Categories>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Comment.name) private commentModel: Model<Comment>
  ) {}

  @ApiOperation({
    summary: "Get tất cả bình luận trong sản phẩm",
  })
  @AuthNotRequired()
  @ApiTags("Public Comment")
  @Get("")
  async getCommentsByProductId(
    @Query("product-slug") slug: string,
    @Query() query: PaginationDto
  ) {
    const product = await this.productService.findProductBySlug(slug);

    if (!product) throw new NotFoundException("PRODUCT NOT FOUND");

    const filter: FilterQuery<Comment> = {
      product: product._id,
      status: ENUM_COMMENT_TYPE.ACTIVE,
    };

    return this.commentService.getCommentsByFilter(
      query.limit,
      query.page,
      query.getSkip(),
      filter
    );
  }

  @ApiOperation({
    summary: "Bình luận sảm phẩm",
  })
  @ApiTags("Private Comment")
  @Roles(ENUM_ROLE_TYPE.CUSTOMER, ENUM_ROLE_TYPE.SELLER)
  @Post("")
  async createCommentForProduct(
    @CurrentUser() user: User,
    @Query() query: CreateCommentDto
  ) {
    const product = await this.productService.findProductBySlug(
      query.productSlug
    );

    const body: Partial<Comment> = {
      user: user,
      product: product,
      content: query.content,
      parent: query.parent,
    };

    return this.commentService.create(body);
  }

  @ApiOperation({
    summary: "Update Bình luận sảm phẩm",
  })
  @ApiTags("Private Comment")
  @Roles(ENUM_ROLE_TYPE.CUSTOMER, ENUM_ROLE_TYPE.SELLER)
  @Patch("")
  async updateCommentForProduct(
    @CurrentUser() user: User,
    @Query("comment", new ParseObjectIdPipe()) id: string,
    @Query("content") content: string
  ) {
    return this.commentService.update(new Types.ObjectId(id), user, content);
  }

  @ApiOperation({
    summary: "Delete Bình luận sảm phẩm",
  })
  @ApiTags("Private Comment")
  @Roles(ENUM_ROLE_TYPE.CUSTOMER, ENUM_ROLE_TYPE.SELLER)
  @Delete("")
  async DeleteCommentForProduct(
    @CurrentUser() user: User,
    @Query("comment", new ParseObjectIdPipe()) id: string
  ) {
    return this.commentService.delete(new Types.ObjectId(id), user);
  }
}
