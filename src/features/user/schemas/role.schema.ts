import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { createSchemaForClassWithMethods } from '../../../shared/mongoose/create-schema';

@Schema({ timestamps: true })
export class Role extends Document {
    @Prop()
    name: string;
}

export const RoleSchema = createSchemaForClassWithMethods(Role);
