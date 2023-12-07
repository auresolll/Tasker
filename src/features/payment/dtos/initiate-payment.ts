import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class InitiatePaymentDto {
  @ApiProperty()
  amount: number;
}

export class InitiatePaymentOrderDto {
  @ApiProperty()
  @IsNumber()
  amount: number;
}
