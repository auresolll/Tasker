import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty()
  @IsString()
  avatar: string;

  @ApiProperty()
  @IsString()
  @MinLength(0)
  @MaxLength(20)
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(0)
  @MaxLength(20)
  username: string;

  @ApiProperty()
  @IsString()
  @MinLength(0)
  @MaxLength(200)
  bio: string;

  @ApiProperty()
  @IsDateString()
  birthday: Date;

  @ApiProperty()
  @IsString()
  @MinLength(0)
  @MaxLength(100)
  website: string;
}
