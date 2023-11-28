import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsNotEmpty, IsString, Matches } from "class-validator";
import { ENUM_ROLE_TYPE } from "src/shared/constants/role";

export class UpdateRoleDto {
  @ApiProperty()
  @IsString()
  @IsMongoId()
  userID: string;

  @ApiProperty({ enum: [ENUM_ROLE_TYPE.CUSTOMER, ENUM_ROLE_TYPE.SELLER] })
  @IsNotEmpty()
  @IsString()
  role: string;
}

export class ResponseUpdateRoleDto extends UpdateRoleDto {}
