import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsMongoId,
  IsNumber,
  IsString,
  Min
} from "class-validator";
import { Categories } from "../schemas/categories.schema";

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  @IsMongoId()
  categories: string;

  @ApiProperty()
  @IsNumber()
  @Min(1000)
  price: number;

  @ApiProperty({ isArray: true })
  @IsArray()
  pictures: string[];

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsString()
  description: string;
}
