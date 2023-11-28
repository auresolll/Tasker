import { Prop, Schema } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { createSchemaForClassWithMethods } from "../../../shared/mongoose/create-schema";

@Schema({ timestamps: true })
export class Categories extends Document {
  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop({ unique: true, required: true, type: String, slug: "title" })
  slug: string;
}

export const CategoriesSchema = createSchemaForClassWithMethods(Categories);

CategoriesSchema.pre("save", function (next) {
  this.slug = this.name.split(" ").join("-");
  next();
});
