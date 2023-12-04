import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, IsString } from 'class-validator';
import { ENUM_TRANSACTION_TYPE } from '../schemas/transaction.schema';
import { Type } from 'class-transformer';

export class CreateTransactionTransferMoneyDto {
  @ApiProperty()
  @IsMongoId()
  receiver: string;

  @ApiProperty()
  @IsMongoId()
  depositor: string;

  @ApiProperty()
  @IsNumber()
  amount: number;
}

export class CreateTransactionDto {
  @ApiProperty({ enum: ENUM_TRANSACTION_TYPE })
  transaction_type: ENUM_TRANSACTION_TYPE;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  accountNumber: string;
}
