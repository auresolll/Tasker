import { Voucher } from "./../schemas/voucher.schema";
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
@Controller("promotions")
export class VoucherController {
  constructor(
    @InjectModel(Voucher.name) private VoucherModel: Model<Voucher>
  ) {}

  @ApiOperation({
    summary: "Get tất cả loại mã khuyến mãi",
  })
  @AuthNotRequired()
  @ApiTags("Public Promotions")
  @Get("vouchers")
  async getVouchers() {
    return this.VoucherModel.find();
  }
}
