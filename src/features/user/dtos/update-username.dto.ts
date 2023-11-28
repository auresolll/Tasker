import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class UpdateUsernameDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @Matches(/[a-zA-Z0-9_-]{2,20}/, {
        message: 'Invalid username',
    })
    username: string;
}

export class ResponseUpdateUsernameDto extends UpdateUsernameDto {}
