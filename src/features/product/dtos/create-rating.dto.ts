import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsNumber, IsNumberString, IsString, Max, Min } from "class-validator";

export class CreateRatingDto {
  @ApiProperty()
  @Min(1)
  @Max(5)
  @IsNumber()
  star: number;

  @ApiProperty()
  @IsMongoId()
  @IsString()
  productId: string;
}
