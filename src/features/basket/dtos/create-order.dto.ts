import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
  @Type(() => Number)
  quantity: number;

  @ApiProperty()
  @Type(() => Number)
  @Min(1000)
  orderPrice: number;
}
