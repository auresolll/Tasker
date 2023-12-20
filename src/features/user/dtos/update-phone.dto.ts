import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UpdatePhoneDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  phone: string;
}

export class ResponseUpdatePhoneDto extends UpdatePhoneDto {}
