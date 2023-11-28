import { Prop, Schema } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { User } from "src/features/user/schemas/user.schema";
import { ObjectId } from "src/shared/mongoose/object-id";
import { createSchemaForClassWithMethods } from "../../../shared/mongoose/create-schema";
import { Product } from "./product.schema";

export enum ENUM_COMMENT_TYPE {
  ACTIVE = "ACTIVE",
  DISABLE = "DISABLE",
}
@Schema({ timestamps: true })
export class Comment extends Document {
  @Prop({ type: ObjectId, ref: User.name })
  user: User;

  @Prop({ type: ObjectId, ref: Product.name })
  product: Product;

  @Prop({ default: "" })
  parent: string;

  @Prop()
  content: string;

  @Prop({ enum: ENUM_COMMENT_TYPE, default: ENUM_COMMENT_TYPE.ACTIVE })
  status: ENUM_COMMENT_TYPE;
}

export const CommentSchema = createSchemaForClassWithMethods(Comment);
