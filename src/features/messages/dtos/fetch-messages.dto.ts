import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional } from 'class-validator';
import { ENUM_MESSAGE_TYPE } from '../schemas/messages.schema';

export class FetchMessagesDto {
    @ApiProperty({ default: 30 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    before: Date;
}

export class From {
    @ApiProperty()
    _id: string;

    @ApiProperty()
    username: string;

    @ApiProperty()
    online: boolean;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty()
    __v: number;

    @ApiProperty()
    isSocial: boolean;

    @ApiProperty()
    id: string;
}

export class ResponseGetFirstDirectMessageDto {
    @ApiProperty()
    _id: string;

    @ApiProperty()
    content: string;

    @ApiProperty({ enum: ENUM_MESSAGE_TYPE })
    type: ENUM_MESSAGE_TYPE;

    @ApiProperty({ type: () => From })
    from: From;

    @ApiProperty({ type: () => From })
    to: From;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty()
    __v: number;
}

export class ResponseGetDirectMessagesDto extends ResponseGetFirstDirectMessageDto {}
export class ResponseRecallMessageDto {
    @ApiProperty()
    message: string;

    @ApiProperty()
    idRecalled: string;
}
