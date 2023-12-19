import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsMongoId,
  IsNumber,
  IsNumberString,
  IsString,
  Max,
  Min,
  isArray,
} from 'class-validator';
import { ENUM_VOUCHER_TYPE } from '../schemas/voucher.schema';
import { Type } from 'class-transformer';

class BasePromotion {
  @ApiProperty()
  @IsDateString({ strict: true })
  start_date: Date;

  @ApiProperty()
  @IsDateString({ strict: true })
  end_date: Date;
}
export class CreateDiscountProductDto extends BasePromotion {
  @ApiProperty()
  @Min(0)
  @Max(100)
  @IsNumber()
  discount: number;

  @ApiProperty()
  items: string[];
}
export class CreatePreferentialPriceDto extends BasePromotion {
  @ApiProperty()
  @Min(0)
  @Max(100)
  @IsNumber()
  discount: number;

  @ApiProperty()
  @Min(0)
  @IsNumber()
  min_purchase_amount: number;
}

export class CreateGiftDto extends BasePromotion {
  @ApiProperty({ isArray: true })
  products_ids: string[];
}
