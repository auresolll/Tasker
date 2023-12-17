import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsMongoId, IsNumber, IsString } from 'class-validator';

export class InitiatePaymentDto {
  @ApiProperty()
  amount: number;
}

export class InitiatePaymentOrderDto {
  @ApiProperty()
  @IsMongoId()
  @IsString()
  orderID: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  amount: number;
}
