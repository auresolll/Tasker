import { ApiProperty } from "@nestjs/swagger";
import {
  IsMongoId,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  @IsMongoId()
  product: string;

  @ApiProperty()
  @Min(1)
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(1000)
  orderPrice: number;
}
