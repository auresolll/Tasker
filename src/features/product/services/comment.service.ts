import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";
import { Order } from "src/features/basket/schemas/order.schema";
import { User } from "src/features/user/schemas/user.schema";
import { ResponsePaginationDto } from "../../../shared/constants/pagination";
import { Comment, ENUM_COMMENT_TYPE } from "../schemas/comment.schema";
import { Rating } from "../schemas/rating.schema";
import { blockFieldUser } from "src/shared/constants/blockField";
import { forEach } from "lodash";

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Rating.name) private ratingModel: Model<Rating>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Comment.name) private commentModel: Model<Comment>
  ) {}

  delete(id: Types.ObjectId, user: User) {
    const filter = { _id: id, user: user._id };
    const update = {
      status: ENUM_COMMENT_TYPE.DISABLE,
    };

    return this.commentModel.findOneAndUpdate(filter, update);
  }

  create(body: Partial<Comment>): Promise<Comment> {
    return this.commentModel.create(body);
  }

  update(id: Types.ObjectId, user: User, content: string): Promise<Comment> {
    const filter = { _id: id, user: user._id };
    const update = { content: content };

    return this.commentModel.findOneAndUpdate(filter, update);
  }

  async getCommentsByFilter(
    limit: number,
    page: number,
    skip: number,
    filter: FilterQuery<Comment>
  ): Promise<ResponsePaginationDto<Comment>> {
    const [comments, count] = await Promise.all([
      this.commentModel
        .find(filter)
        .limit(limit)
        .skip(skip)
        .populate("user", blockFieldUser),
      this.commentModel.count(filter),
    ]);



    return {
      totalItem: count,
      totalPage: Math.ceil(count / limit),
      limit,
      currentPage: page,
      result: comments,
    };
  }
}
