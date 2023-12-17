import { ApiProperty } from '@nestjs/swagger';
import {
  ENUM_TRANSACTION_STATUS,
  ENUM_TRANSACTION_TYPE,
} from '../schemas/transaction.schema';

export class UpdateTransactionDto {
  @ApiProperty({ enum: ENUM_TRANSACTION_TYPE })
  transaction_type: ENUM_TRANSACTION_STATUS;
}
