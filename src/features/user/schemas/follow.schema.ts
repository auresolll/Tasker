import { Prop, Schema } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { createSchemaForClassWithMethods } from "../../../shared/mongoose/create-schema";
import { ObjectId } from "../../../shared/mongoose/object-id";
import { User } from "./user.schema";

@Schema({ timestamps: true })
export class Follow extends Document {
  @Prop({ type: ObjectId, ref: User.name })
  follower: User;

  @Prop({ type: ObjectId, ref: User.name })
  following: User;

  @Prop({ type: Date, default: null })
  deletedAt: Date;
}

export const FollowSchema = createSchemaForClassWithMethods(Follow);
