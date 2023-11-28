import { Prop, Schema } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { User } from "src/features/user/schemas/user.schema";
import { ObjectId } from "src/shared/mongoose/object-id";
import { createSchemaForClassWithMethods } from "../../../shared/mongoose/create-schema";

export enum ENUM_TRANSACTION_TYPE {
  WITHDRAWAL = "Rút tiền",
  RECHARGE = "Nạp tiền",
}

@Schema({ timestamps: true })
export class Transaction extends Document {
  @Prop({ type: ObjectId, ref: User.name })
  user: User;

  @Prop({ type: Number, required: true, min: 0 })
  amount: number;

  @Prop({ enum: ENUM_TRANSACTION_TYPE, required: true })
  description: ENUM_TRANSACTION_TYPE;

  @Prop({ type: Date, default: null })
  deletedAt: Date;
}

export const TransactionSchema = createSchemaForClassWithMethods(Transaction);
