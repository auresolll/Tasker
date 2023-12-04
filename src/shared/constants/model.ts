import {
  Comment,
  CommentSchema,
} from './../../features/product/schemas/comment.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Subscription } from 'rxjs';
import { Order, OrderSchema } from 'src/features/basket/schemas/order.schema';
import { Media, MediaSchema } from 'src/features/messages/schemas/media.schema';
import {
  Message,
  MessageSchema,
} from 'src/features/messages/schemas/messages.schema';
import {
  Transaction,
  TransactionSchema,
} from 'src/features/payment/schemas/transaction.schema';
import {
  Categories,
  CategoriesSchema,
} from 'src/features/product/schemas/categories.schema';
import {
  Product,
  ProductSchema,
} from 'src/features/product/schemas/product.schema';
import {
  Promotion,
  PromotionSchema,
} from 'src/features/product/schemas/promotions.schema';
import {
  Rating,
  RatingSchema,
} from 'src/features/product/schemas/rating.schema';
import {
  Voucher,
  VoucherSchema,
} from 'src/features/product/schemas/voucher.schema';
import { Follow, FollowSchema } from 'src/features/user/schemas/follow.schema';
import {
  Recover,
  RecoverSchema,
} from 'src/features/user/schemas/recover.schema';
import {
  SocketConnection,
  SocketConnectionSchema,
} from 'src/features/user/schemas/socket-connection.schema';
import { SubscriptionSchema } from 'src/features/user/schemas/subscription.schema';
import { User, UserSchema } from 'src/features/user/schemas/user.schema';

export const Models = MongooseModule.forFeature([
  {
    name: User.name,
    schema: UserSchema,
  },
  {
    name: Recover.name,
    schema: RecoverSchema,
  },
  {
    name: SocketConnection.name,
    schema: SocketConnectionSchema,
  },
  {
    name: Subscription.name,
    schema: SubscriptionSchema,
  },
  {
    name: Product.name,
    schema: ProductSchema,
  },
  {
    name: Follow.name,
    schema: FollowSchema,
  },
  {
    name: Message.name,
    schema: MessageSchema,
  },
  {
    name: Media.name,
    schema: MediaSchema,
  },
  {
    name: Order.name,
    schema: OrderSchema,
  },
  {
    name: Product.name,
    schema: ProductSchema,
  },
  {
    name: Categories.name,
    schema: CategoriesSchema,
  },
  {
    name: Rating.name,
    schema: RatingSchema,
  },
  {
    name: Comment.name,
    schema: CommentSchema,
  },
  {
    name: Transaction.name,
    schema: TransactionSchema,
  },
  {
    name: Promotion.name,
    schema: PromotionSchema,
  },
  {
    name: Voucher.name,
    schema: VoucherSchema,
  },
]);
