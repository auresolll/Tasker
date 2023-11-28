import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ResponseGetMeDto } from './response.dto';

export class LoginDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    @MaxLength(60)
    password: string;
}

export class ResponseLoginDto {
    @ApiProperty()
    access_token: string;
}

export class ResponseRegisterDto {
    @ApiProperty()
    message: string;

    @ApiProperty({ type: () => ResponseGetMeDto })
    info: ResponseGetMeDto;
}
