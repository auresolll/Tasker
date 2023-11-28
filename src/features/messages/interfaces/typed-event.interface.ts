import { Types } from 'mongoose';
import { User } from 'src/features/user/schemas/user.schema';
import { DirectMessageDto } from '../dtos/direct-message.dto';

export interface TypedEventMessages {
    sendDirectMessage(body: DirectMessageDto, user: User): Promise<boolean>;
    sendDirectTyping(userId: Types.ObjectId, user: User): Promise<boolean>;
}
