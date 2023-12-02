import { Module, forwardRef } from '@nestjs/common';
import { Models } from 'src/shared/constants/model';
import { AuthModule } from '../auth/auth.module';
import { TransactionController } from './controllers/transaction.controller';
import { TransactionService } from './services/transaction.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [Models, forwardRef(() => AuthModule), forwardRef(() => UserModule)],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}
