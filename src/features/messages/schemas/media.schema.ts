import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { createSchemaForClassWithMethods } from '../../../shared/mongoose/create-schema';
import { ObjectId } from '../../../shared/mongoose/object-id';
import { User } from './../../user/schemas/user.schema';

export enum ENUM_MEDIA_TYPE {
    FILE_IMAGE = 'FILE_IMAGE',
    FILE_DOC = 'FILE_DOC',
    FILE_MEDIA = 'FILE_MEDIA',
}

@Schema({ timestamps: true })
export class Media extends Document {
    @Prop({
        required: true,
    })
    name: string;

    @Prop({
        required: true,
    })
    url: string;

    @Prop({
        type: String,
        enum: ENUM_MEDIA_TYPE,
    })
    type: ENUM_MEDIA_TYPE;

    @Prop({ type: ObjectId, ref: User.name })
    from: User;

    @Prop({ type: ObjectId, ref: User.name })
    to?: User;
}

export const MediaSchema = createSchemaForClassWithMethods(Media);
