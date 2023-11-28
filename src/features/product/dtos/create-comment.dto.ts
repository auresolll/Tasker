import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  Min,
  IsArray,
  IsMongoId,
  IsOptional,
} from "class-validator";

export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  parent: string;

  @ApiProperty()
  @IsString()
  productSlug: string;
}
