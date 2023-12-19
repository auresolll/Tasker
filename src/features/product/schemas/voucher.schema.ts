import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { createSchemaForClassWithMethods } from '../../../shared/mongoose/create-schema';

export enum ENUM_VOUCHER_TYPE {
  PRODUCT_DISCOUNT = '655caa32d7b31be96da71a26',
  PREFERENTIAL_PRICE = '655caa57d7b31be96da71a27',
  GIFT = '655caa88d7b31be96da71a29',
}

@Schema({ timestamps: true })
export class Voucher extends Document {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date;
}

export const VoucherSchema = createSchemaForClassWithMethods(Voucher);
