import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from 'src/features/user/schemas/user.schema';
import { ObjectId } from 'src/shared/mongoose/object-id';
import { createSchemaForClassWithMethods } from '../../../shared/mongoose/create-schema';

export enum ENUM_TRANSACTION_TYPE {
  WITHDRAWAL = 'Rút tiền',
  RECHARGE = 'Nạp tiền',
  TRANSFER_MONEY = 'Chuyển tiền',
}

export enum ENUM_TRANSACTION_STATUS {
  PEENING = 'Đang xử lý',
  FAILED = 'Thất bại',
  SUCCEED = 'Thành công',
}

@Schema({ timestamps: true })
export class Transaction extends Document {
  @Prop({ type: ObjectId, ref: User.name })
  receiver: User;

  @Prop({ type: ObjectId, ref: User.name })
  depositor: User;

  @Prop({ type: Number, required: true, min: 0 })
  amount: number;

  @Prop({ type: String, required: true })
  accountNumber: string;

  @Prop({ enum: ENUM_TRANSACTION_TYPE, required: true })
  description: ENUM_TRANSACTION_TYPE;

  @Prop({ enum: ENUM_TRANSACTION_STATUS, required: true })
  status: ENUM_TRANSACTION_STATUS;

  @Prop({ type: Date, default: null })
  deletedAt: Date;
}

export const TransactionSchema = createSchemaForClassWithMethods(Transaction);
