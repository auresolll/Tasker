import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsOptional, IsString } from "class-validator";
import { PaginationDto } from "src/shared/constants/pagination";
import { ENUM_PROJECT_SORT } from "./../../../shared/constants/pagination";

export class FetchProductsDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  categories: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({
    enum: ENUM_PROJECT_SORT,
  })
  @IsString()
  sort: ENUM_PROJECT_SORT;
}

export class FetchHotProductsDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  categories: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({
    enum: ENUM_PROJECT_SORT,
    required: false,
  })
  @IsOptional()
  @IsString()
  sort: ENUM_PROJECT_SORT;
}
