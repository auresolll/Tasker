import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsMongoId,
  IsNumber,
  IsNumberString,
  IsString,
  Max,
  Min,
  isArray,
} from "class-validator";
import { ENUM_VOUCHER_TYPE } from "../schemas/voucher.schema";

export class CreatePromotionDto {
  @ApiProperty()
  @IsMongoId()
  @IsString()
  voucherID: string;

  @ApiProperty()
  @IsDateString({ strict: true })
  start_date: Date;

  @ApiProperty()
  @IsDateString({ strict: true })
  end_date: Date;

  @ApiProperty()
  @Min(0)
  @Max(100)
  @IsNumber()
  min_purchase_amount: number;

  @ApiProperty()
  @Min(0)
  @Max(100)
  @IsNumber()
  discount: number;

  @ApiProperty()
  items: string[];

  setFieldsBasedOnEnum() {
    switch (this.voucherID) {
      case ENUM_VOUCHER_TYPE.PRODUCT_DISCOUNT:
        this.min_purchase_amount = null;
        this.items = null;
        break;
      case ENUM_VOUCHER_TYPE.PREFERENTIAL_PRICE:
        this.items = null;
        break;
      case ENUM_VOUCHER_TYPE.GIFT:
        this.discount = null;
        this.min_purchase_amount = null;
        break;
      default:
        this.items = null;
    }
  }
}
