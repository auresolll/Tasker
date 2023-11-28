import { Prop, Schema } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { User } from "src/features/user/schemas/user.schema";
import { ObjectId } from "src/shared/mongoose/object-id";
import { createSchemaForClassWithMethods } from "../../../shared/mongoose/create-schema";
import { Product, ProductSchema } from "./product.schema";
import { Voucher } from "./voucher.schema";
import { IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

@Schema({ timestamps: true })
export class Promotion extends Document {
  @Prop({ type: ObjectId, ref: User.name })
  user: User;

  @Prop({ type: ObjectId, ref: Voucher.name })
  voucher: Voucher;

  @Prop({ type: String, required: true })
  code: string;

  @Prop({ type: Date, required: true })
  start_date: Date;

  @Prop({ type: Date, required: true })
  end_date: Date;

  @Prop({ type: Number, default: null })
  min_purchase_amount: number;

  @Prop({ type: Number, default: null })
  discount: number;

  @Prop({ type: [String] })
  items: string[];

  @Prop({ type: Date, default: null })
  deletedAt: Date;
}

export const PromotionSchema = createSchemaForClassWithMethods(Promotion);
