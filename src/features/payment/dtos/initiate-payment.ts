import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, IsString } from 'class-validator';

export class InitiatePaymentDto {
  @ApiProperty()
  amount: number;
}
