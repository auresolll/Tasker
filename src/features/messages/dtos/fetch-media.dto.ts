import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { ENUM_MEDIA_TYPE } from '../schemas/media.schema';
import { FetchMessagesDto } from './fetch-messages.dto';

export class FetchMediaDto extends FetchMessagesDto {
    @ApiProperty({ enum: ENUM_MEDIA_TYPE, required: false })
    @IsOptional()
    type: ENUM_MEDIA_TYPE;
}
