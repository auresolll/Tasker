import {
    ArgumentMetadata,
    BadRequestException,
    Injectable,
    PipeTransform,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { Types } from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata) {
        if (!ObjectId.isValid(value)) {
            throw new BadRequestException(`${metadata.data} must be an ObjectId`);
        }

        return new Types.ObjectId(value);
    }
}
