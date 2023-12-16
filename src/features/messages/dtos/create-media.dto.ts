import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { User } from 'src/features/user/schemas/user.schema';
import { ENUM_MEDIA_TYPE } from '../schemas/media.schema';

export class CreateMediaDto {
  @ApiProperty({ required: true })
  @IsString()
  fileName: string;

  @ApiProperty({ required: true })
  @IsString()
  url: string;

  @ApiProperty({ enum: ENUM_MEDIA_TYPE, required: true })
  type: ENUM_MEDIA_TYPE;

  from: User;

  to: User;
  constructor(
    from: User,
    to: User,
    fileName: string,
    url: string,
    type: ENUM_MEDIA_TYPE,
  ) {
    this.fileName = fileName;
    this.url = url;
    this.from = from;
    this.to = to;
    this.type = type;
  }
}
