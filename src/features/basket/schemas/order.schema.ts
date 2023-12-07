import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Product } from 'src/features/product/schemas/product.schema';
import { User } from 'src/features/user/schemas/user.schema';
import { ObjectId } from 'src/shared/mongoose/object-id';
import { createSchemaForClassWithMethods } from '../../../shared/mongoose/create-schema';
import { Promotion } from 'src/features/product/schemas/promotions.schema';

export enum ENUM_ORDER_STATUS {
  SUCCESSFULLY = 'Giao dịch thành công',
  FAILED = 'Chờ thanh toán',
}
@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: ObjectId, ref: User.name })
  user: User;

  @Prop({ type: ObjectId, ref: Product.name })
  product: Product;

  @Prop({ default: 1, min: 1 })
  quantity: number;

  @Prop({ enum: ENUM_ORDER_STATUS, default: ENUM_ORDER_STATUS.SUCCESSFULLY })
  status: ENUM_ORDER_STATUS;

  @Prop({ type: ObjectId, ref: Promotion.name, default: null })
  promotion: Promotion;

  @Prop({ required: true, min: 1000 })
  orderPrice: number;

  @Prop({ required: true, min: 1000 })
  totalPrice: number;
}

export const OrderSchema = createSchemaForClassWithMethods(Order);
