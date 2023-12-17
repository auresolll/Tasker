import { Module, forwardRef } from '@nestjs/common';
import { Models } from 'src/shared/constants/model';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { PaymentController } from './controllers/payment.controller';
import { PaymentService } from './services/payment.service';
import { PaymentAnalysisService } from './services/payment-analysis.service';

@Module({
  imports: [Models, forwardRef(() => AuthModule), forwardRef(() => UserModule)],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentAnalysisService],
})
export class PaymentModule {}
