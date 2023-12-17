import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Socket } from 'socket.io';
import { UserGateway } from '../gateway/user.gateway';
import { User } from '../schemas/user.schema';
import { SocketConnectionService } from './socket-connection.service';

@Injectable()
export class UserService {
  private blockedFields: (keyof User)[] = [
    'password',
    'sessionToken',
    'facebookId',
    'googleId',
    'id',
  ];

  unpopulatedFields = '-' + this.blockedFields.join(' -');

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @Inject(forwardRef(() => UserGateway)) private userGateway: UserGateway,
    private socketConnectionService: SocketConnectionService,
  ) {}

  async getUsers() {
    return this.userModel.find();
  }
  async getUserById(id: Types.ObjectId) {
    return await this.userModel.findById(id);
  }

  getOnlineUsers() {
    return this.userModel.find({
      online: true,
    });
  }
  getUserByName(name: string) {
    const username = { $regex: new RegExp(`^${name}$`, 'i') };
    return this.userModel.findOne({ username });
  }

  getUserByEmail(mail: string) {
    const email = { $regex: new RegExp(`^${mail}$`, 'i') };

    return this.userModel.findOne({ email });
  }

  getUserBy(filter: FilterQuery<User>) {
    return this.userModel.findOne(filter);
  }

  async validateUserById(id: Types.ObjectId) {
    const user = await this.getUserById(id);

    if (!user) throw new NotFoundException('User.Not found');

    return user;
  }

  async validateUserByName(username: string) {
    const user = await this.getUserByName(username);

    if (!user) throw new HttpException('User.Not found', HttpStatus.NOT_FOUND);

    return user;
  }

  async validateUserByEmail(mail: string) {
    const user = await this.getUserByEmail(mail);

    if (!user) throw new HttpException('User.Not found', HttpStatus.NOT_FOUND);

    return user;
  }

  async create(body: Partial<User>) {
    const user = await this.userModel.create(body);
    user.generateSessionToken();
    return user.save();
  }

  sendMessage<T>(user: User, event: string, message?: T) {
    return this.userGateway.server.to(`user_${user._id}`).emit(event, message);
  }

  async subscribeSocket(socket: Socket, user: User) {
    await this.socketConnectionService.create(socket, user);
    return socket.join(`user_${user._id}`);
  }

  async unsubscribeSocket(socket: Socket, user: User) {
    await this.socketConnectionService.delete(socket);
    return socket.leave(`user_${user._id}`);
  }

  filterUser(user: User, allowedFields: (keyof User)[] = []) {
    const userObject = user.toObject({ virtuals: true });

    for (const field of this.blockedFields) {
      if (allowedFields.includes(field)) {
        continue;
      }

      delete userObject[field];
    }

    return userObject;
  }
}
