import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { get, toPlainObject } from 'lodash';
import moment from 'moment';
import { FilterQuery, Model, Types } from 'mongoose';
import { CreateMessageDto } from '../dtos/create-message.dto';
import { ENUM_MESSAGE_TYPE, Message } from '../schemas/messages.schema';
import { User } from './../../user/schemas/user.schema';
import { UserService } from './../../user/services/user.service';
import { getFieldIds } from 'src/shared/utils/get-ids';

const MAX_EXPIRED = 5;

@Injectable()
export class MessageService {
  private blockedFields: (keyof Message)[] = ['id', 'recall'];
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(User.name) private userModel: Model<User>,

    private userService: UserService,
  ) {}

  unpopulatedFields = '-' + this.blockedFields.join(' -');

  async getInfoUserChat(user: User) {
    const filter: FilterQuery<Message> = {
      from: user._id,
      recall: false,
    };
    const usersMessagesTo = await this.messageModel.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: '$to',
          createdAt: { $first: '$createdAt' },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);
    const promises = [];

    const isUsers = await this.userModel.find({
      _id: { $in: getFieldIds(usersMessagesTo) },
    });

    isUsers.forEach((dataset) => {
      promises.push(Promise.resolve(this.getFirstDirectMessage(user, dataset)));
    });

    return Promise.all(promises);
  }

  async getFirstDirectMessage(from: User, to: User) {
    return this.messageModel
      .findOne(this.getDirectMessageFilter(from, to))
      .sort({ createdAt: -1 })
      .populate('from', this.userService.unpopulatedFields)
      .populate('to', this.userService.unpopulatedFields);
  }

  async getDirectMessages(
    from: User,
    to: User,
    limit = 30,
    before?: Date,
  ): Promise<Message[]> {
    const filter: FilterQuery<Message> = {
      ...this.getDirectMessageFilter(from, to),
      createdAt: { $lte: before },
    };

    if (!before) {
      delete filter.createdAt;
    }

    return this.getMessages(filter, limit);
  }

  async createDirectMessage(
    from: User,
    to: User,
    content: string,
    type: ENUM_MESSAGE_TYPE,
  ) {
    const object = await this.messageModel.create(
      toPlainObject(new CreateMessageDto(content, type, from, to)),
    );

    return {
      ...object.toObject(),
      from: get(object.from, '_id', null),
      to: get(object.to, '_id', null),
    };
  }

  getMessageBy(filter: FilterQuery<Message>) {
    try {
      return this.messageModel.findOne(filter);
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  async recall(owner: User, messageId: Types.ObjectId) {
    const filter = {
      _id: messageId,
      from: owner._id,
      recall: false,
    };
    const message = await this.getMessageBy(filter);

    if (!message)
      throw new HttpException('Không tìm thấy message', HttpStatus.NOT_FOUND);

    const expired = moment
      .duration(moment().diff(moment(message['createdAt'])))
      .minutes();

    if (expired > MAX_EXPIRED)
      throw new HttpException('Hết thời gian thu hồi', HttpStatus.BAD_GATEWAY);

    message.recall = true;
    await message.save();
    return {
      message: 'Thu hồi tin message thành công',
      idRecalled: message._id,
    };
  }

  private async getMessages(
    filter: FilterQuery<Message>,
    limit: number,
  ): Promise<Message[]> {
    const messages = await this.messageModel
      .find(filter)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('from', this.userService.unpopulatedFields)
      .populate('to', this.userService.unpopulatedFields);

    return this.sortMessages(messages);
  }

  private getDirectMessageFilter(from: User, to: User): FilterQuery<Message> {
    return {
      $or: [
        {
          from: from._id,
          to: to._id,
        },
        {
          to: from._id,
          from: to._id,
        },
      ],
      $and: [
        {
          ban: { $ne: from._id },
        },
      ],
    };
  }

  sortMessages(messages: Message[]): Message[] {
    return messages.sort(
      (a, b) => a['createdAt'].getTime() - b['createdAt'].getTime(),
    );
  }

  filterMessage(messages: Message[], allowedFields: (keyof Message)[] = []) {
    return messages.map((message) => {
      const messageObject = message.toObject({ virtuals: true });

      for (const field of this.blockedFields) {
        if (allowedFields.includes(field)) continue;

        if (message['recall']) {
          messageObject['content'] = null;
          messageObject['type'] = 'RECALL';
        }

        delete messageObject[field];
      }

      return messageObject;
    });
  }
}
