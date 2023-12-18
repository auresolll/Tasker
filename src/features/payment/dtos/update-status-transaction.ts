import { ApiProperty } from '@nestjs/swagger';
import { ENUM_TRANSACTION_STATUS } from '../schemas/transaction.schema';

export class UpdateTransactionDto {
  @ApiProperty({ enum: ENUM_TRANSACTION_STATUS })
  transaction_type: ENUM_TRANSACTION_STATUS;
}
