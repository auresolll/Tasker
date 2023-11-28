import { Prop, Schema } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { User } from "src/features/user/schemas/user.schema";
import { createSchemaForClassWithMethods } from "../../../shared/mongoose/create-schema";
import { ObjectId } from "src/shared/mongoose/object-id";

@Schema({ timestamps: true })
export class Analytic extends Document {
  @Prop({ type: ObjectId, ref: User.name })
  product: User;

  @Prop({ default: 0 })
  totalBuyer: number;
}

export const AnalyticSchema = createSchemaForClassWithMethods(Analytic);
