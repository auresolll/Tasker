import { Prop, Schema } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { User } from "src/features/user/schemas/user.schema";
import { ObjectId } from "src/shared/mongoose/object-id";
import { createSchemaForClassWithMethods } from "../../../shared/mongoose/create-schema";
import { Product } from "./product.schema";

@Schema({ timestamps: true })
export class Rating extends Document {
  @Prop({ type: ObjectId, ref: User.name })
  user: User;

  @Prop({ type: ObjectId, ref: Product.name })
  product: Product;

  @Prop({ required: true, default: 0, min: 1, max: 5 })
  star: number;
}

export const RatingSchema = createSchemaForClassWithMethods(Rating);
