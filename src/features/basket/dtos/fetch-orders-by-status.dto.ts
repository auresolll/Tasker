import { ApiProperty } from "@nestjs/swagger";
import { ENUM_ORDER_STATUS } from "../schemas/order.schema";
import { IsString } from "class-validator";
import { PaginationDto } from "src/shared/constants/pagination";

export class FetchOrdersByStatus extends PaginationDto {
  @ApiProperty({ enum: ENUM_ORDER_STATUS })
  @IsString()
  status: ENUM_ORDER_STATUS;
}
