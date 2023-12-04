import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { BasketModule } from './basket/basket.module';
import { MessagesModule } from './messages/messages.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    MessagesModule,
    ProductModule,
    BasketModule,
    PaymentModule,
  ],
  controllers: [],
  exports: [
    UserModule,
    AuthModule,
    MessagesModule,
    ProductModule,
    BasketModule,
    PaymentModule,
  ],
})
export class FeaturesModule {}
