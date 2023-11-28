import { ApiProperty } from "@nestjs/swagger";
import {
  IsMongoId,
  IsOptional,
  IsString
} from "class-validator";
import {
  ENUM_SORT_TYPE,
  PaginationDto
} from "../../../shared/constants/pagination";

export class FetchProductsByUser extends PaginationDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @IsMongoId()
  categoriesID: string;

  @ApiProperty({ enum: ENUM_SORT_TYPE })
  @IsString()
  timeSort: ENUM_SORT_TYPE;
}
