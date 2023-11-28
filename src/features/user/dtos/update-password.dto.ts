import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePasswordDto {
    @ApiProperty()
    @IsOptional()
    @IsString()
    currentPassword?: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    @MaxLength(60)
    password: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    confirmPassword: string;
}

export class ResponseUpdatePasswordDto {
    @ApiProperty({ type: Boolean })
    isPassword: boolean;
}
