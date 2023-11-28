import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { ENUM_RECOVER_TYPE } from "../schemas/recover.schema";

export class RecoverPasswordDto {
  @ApiProperty({ default: "a@a.com" })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    enum: [
      ENUM_RECOVER_TYPE.CHANGE_PASSWORD,
      ENUM_RECOVER_TYPE.FORGET_PASSWORD,
    ],
  })
  type: ENUM_RECOVER_TYPE;
}

export class ValidateRecoverCodeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(60)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,60}$/,
    {
      message:
        "Tối thiểu 6 và tối đa 60 ký tự, ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt:",
    }
  )
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(60)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,60}$/,
    {
      message:
        "Tối thiểu 6 và tối đa 60 ký tự, ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt:",
    }
  )
  confirmPassword: string;
}
