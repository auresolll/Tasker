import { TransactionModule } from './transaction/transaction.module';
import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";
import { ProductModule } from "./product/product.module";
import { BasketModule } from "./basket/basket.module";
import { MessagesModule } from './messages/messages.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    MessagesModule,
    ProductModule,
    BasketModule,
    TransactionModule
  ],
  controllers: [],
  exports: [
    UserModule,
    AuthModule,
    MessagesModule,
    ProductModule,
    BasketModule,
    TransactionModule
  ],
})
export class FeaturesModule {}
