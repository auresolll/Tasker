import { Prop, Schema } from "@nestjs/mongoose";
import * as bcrypt from "bcrypt";
import { Document } from "mongoose";
import { ObjectId } from "src/shared/mongoose/object-id";
import { createSchemaForClassWithMethods } from "../../../shared/mongoose/create-schema";
import { randomString } from "../../../shared/utils/random-string";
import { Role } from "./role.schema";

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ default: "" })
  username: string;

  @Prop({ default: "" })
  name: string;

  @Prop({ default: null })
  bio: string;

  @Prop({ default: "" })
  email: string;

  @Prop()
  sessionToken: string;

  @Prop({ type: ObjectId, ref: Role.name })
  role: Role;

  @Prop({ default: false })
  online: boolean;

  @Prop()
  password?: string;

  @Prop()
  facebookId?: string;

  @Prop()
  googleId?: string;

  @Prop({ default: null })
  avatar?: string;

  @Prop({ default: null })
  phone?: string;

  @Prop({ default: 0 })
  isFlag: number;

  @Prop({ default: null })
  address?: string;

  @Prop({ default: null })
  website?: string;

  @Prop({ default: false })
  activeMail: boolean;

  @Prop({ default: false })
  twoFactorAuthenticationSecret: boolean;

  @Prop({ type: Date, default: null })
  birthday: Date;

  @Prop({ type: Number, default: null, min: 0 })
  balance: number;

  @Prop({ type: String, default: null })
  bank: string | null;

  @Prop({ type: Date, default: null })
  deletedAt: Date;

  get isSocial(): boolean {
    return !!(this.facebookId || this.googleId);
  }

  generateSessionToken() {
    this.sessionToken = randomString(60);
  }

  validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password || "");
  }
}

export const UserSchema = createSchemaForClassWithMethods(User);

// Update password into a hashed one.
UserSchema.pre("save", async function (next) {
  const user: User = this as any;

  if (!user.password || user.password.startsWith("$")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt();

    user.password = await bcrypt.hash(user.password, salt);

    next();
  } catch (e) {
    next(e);
  }
});
