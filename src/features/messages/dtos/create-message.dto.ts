import { User } from 'src/features/user/schemas/user.schema';
import { ENUM_MESSAGE_TYPE } from '../schemas/messages.schema';

export class CreateMessageDto {
    content: string;
    type: ENUM_MESSAGE_TYPE;
    from: User;
    recall: boolean;
    ban: string[];
    to?: User;

    constructor(content: string, type: ENUM_MESSAGE_TYPE, from: User, to?: User) {
        this.content = content;
        this.type = type;
        this.from = from;
        this.recall = false;
        this.ban = [];
        this.to = to;
    }
}
