import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString, Matches } from 'class-validator';
import { ENUM_ROLE_TYPE } from 'src/shared/constants/role';

export class UpdateRoleDto {
  @ApiProperty()
  @IsString()
  @IsMongoId()
  userID: string;

  @ApiProperty({ enum: ENUM_ROLE_TYPE })
  @IsNotEmpty()
  @IsString()
  role: ENUM_ROLE_TYPE;
}

export class ResponseUpdateRoleDto extends UpdateRoleDto {}
