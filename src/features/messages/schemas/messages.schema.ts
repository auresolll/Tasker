import { Prop, Schema } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { createSchemaForClassWithMethods } from "../../../shared/mongoose/create-schema";
import { ObjectId } from "../../../shared/mongoose/object-id";
import { User } from "./../../user/schemas/user.schema";

export enum ENUM_MESSAGE_TYPE {
  TEXT = "TEXT",
  FILE_IMAGE = "FILE_IMAGE",
  FILE_DOC = "FILE_DOC",
  FILE_MEDIA = "FILE_MEDIA",
}

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({
    required: true,
  })
  content: string;

  @Prop({
    type: String,
    enum: ENUM_MESSAGE_TYPE,
  })
  type: ENUM_MESSAGE_TYPE;

  @Prop({ type: ObjectId, ref: User.name })
  from: User;

  @Prop({ type: Boolean, default: false })
  recall: boolean;

  // @Prop({ type: Array<string>, default: [] })
  // ban: string[];

  @Prop({ type: ObjectId, ref: User.name })
  to?: User;
}

export const MessageSchema = createSchemaForClassWithMethods(Message);
