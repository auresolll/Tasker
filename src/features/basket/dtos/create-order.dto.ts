import { ApiProperty } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  @IsMongoId()
  productID: string;

  @ApiProperty()
  @IsOptional()
  @IsMongoId()
  promotionID: string;

  @ApiProperty()
  @Min(1)
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(1000)
  orderPrice: number;
}
