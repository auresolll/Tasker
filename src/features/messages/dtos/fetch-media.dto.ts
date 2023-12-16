import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { FetchMessagesDto } from './fetch-messages.dto';

export class FetchMediaDto extends FetchMessagesDto {}
