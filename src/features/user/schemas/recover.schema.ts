import { Prop, Schema } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { createSchemaForClassWithMethods } from "../../../shared/mongoose/create-schema";
import { ObjectId } from "../../../shared/mongoose/object-id";
import { User } from "./user.schema";

export enum ENUM_RECOVER_TYPE {
  FORGET_PASSWORD = "FORGET_PASSWORD",
  CHANGE_PASSWORD = "CHANGE_PASSWORD",
  TWO_AUTHENTICATION = "TWO_AUTHENTICATION",
}
@Schema({ timestamps: true })
export class Recover extends Document {
  @Prop()
  code: string;

  @Prop({ enum: ENUM_RECOVER_TYPE, required: true })
  type: ENUM_RECOVER_TYPE;

  @Prop({ type: ObjectId, ref: User.name })
  owner: User;

  @Prop()
  expiration: Date;
}

export const RecoverSchema = createSchemaForClassWithMethods(Recover);
