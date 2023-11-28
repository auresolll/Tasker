import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class UpdateTwoFactorAuthenticationSecretDto {
  @ApiProperty({ default: false })
  @IsBoolean()
  status: boolean;
}
