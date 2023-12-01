import { ApiProperty } from "@nestjs/swagger";
import { PaginationDto } from "src/shared/constants/pagination";
import { ENUM_TRANSACTION_TYPE } from "../schemas/transaction.schema";
import { IsOptional } from "class-validator";

export class FetchTransaction extends PaginationDto {
  @ApiProperty({ enum: ENUM_TRANSACTION_TYPE , required: false})
  @IsOptional()
  type: ENUM_TRANSACTION_TYPE;
}
