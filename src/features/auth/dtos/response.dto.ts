import { ApiProperty } from '@nestjs/swagger';

export class ResponseGetMeDto {
    @ApiProperty()
    _id: string;
    @ApiProperty()
    username: string;
    @ApiProperty()
    email: string;
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
}
