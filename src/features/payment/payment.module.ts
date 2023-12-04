import { Module, forwardRef } from '@nestjs/common';
import { Models } from 'src/shared/constants/model';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { PaymentController } from './controllers/payment.controller';
import { PaymentService } from './services/payment.service';

@Module({
  imports: [Models, forwardRef(() => AuthModule), forwardRef(() => UserModule)],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
