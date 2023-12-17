import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from 'src/shared/constants/pagination';
import { ENUM_TRANSACTION_TYPE } from '../schemas/transaction.schema';
import { IsMongoId, IsOptional } from 'class-validator';
