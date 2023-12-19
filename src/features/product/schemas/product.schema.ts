import { Prop, Schema } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from 'src/features/user/schemas/user.schema';
import { ObjectId } from 'src/shared/mongoose/object-id';
import { createSchemaForClassWithMethods } from '../../../shared/mongoose/create-schema';
import { randomString } from './../../../shared/utils/random-string';
import { Categories } from './categories.schema';

export type AccompanyingProducts = {
  name: string;
  price: number;
};

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ type: ObjectId, ref: User.name, index: true })
  creator: User;

  @Prop({ type: ObjectId, ref: Categories.name, index: true })
  categories: Categories;

  @Prop({ required: true, default: 1, min: 1, index: true })
  quantity: number;

  @Prop({ required: true, index: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: 0, min: 0 })
  price: number;

  @Prop({ default: 0, min: 0 })
  numberHasSeller: number;

  @Prop({ default: false })
  statsSale: boolean;

  @Prop({ type: Array, default: [] })
  accompanyingProducts: AccompanyingProducts[];

  @Prop({ required: true })
  pictures: string[];

  @Prop({ unique: true, required: true, type: String, slug: 'title' })
  slug: string;

  @Prop({ required: true, type: Array<object> })
  attach: object | string | Array<object>;

  @Prop({ type: Date, default: null })
  deletedAt: Date;

  async lessQuantity() {
    if (this.quantity <= 0) return;
    this.quantity--;
    return await this.save();
  }
}

export const ProductSchema = createSchemaForClassWithMethods(Product);

ProductSchema.pre('save', function (next) {
  this.slug = this.name.split(' ').join('-').toLowerCase();
  next();
});

ProductSchema.pre('insertMany', function (next, docs) {
  for (const doc of docs) {
    doc.slug = doc.name.split(' ').join('-').toLowerCase();
  }
  next();
});
