import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsNumber, IsDate } from "class-validator";

export enum ENUM_SORT_TYPE {
  DESC = "DESC",
  ASC = "ASC",
}

export class ResponsePaginationDto<T> {
  totalItem: number;
  totalPage: number;
  limit: number;
  currentPage: number;
  result: T[];
}

export enum ENUM_PROJECT_SORT {
  CREATED_DATE = "CREATED_DATE",
  CREATED_DATE_DESC = "CREATED_DATE_DESC",
  PRICE = "PRICE",
  PRICE_DESC = "PRICE_DESC",
  RATING = "RATING",
  RATING_DESC = "RATING_DESC",
  BEST_SELLER = "BEST_SELLER",
  BEST_SELLER_DESC = "BEST_SELLER_DESC",
}


export class PaginationDto {
  @ApiProperty({ default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit: number;

  @ApiProperty({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  before: Date;

  public getSkip() {
    return this.limit * (this.page - 1);
  }
}

