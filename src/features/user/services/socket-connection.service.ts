import { Socket } from 'socket.io';
import { environments } from './../../../environments/environments';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UserService } from './user.service';
import { SocketConnection } from '../schemas/socket-connection.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { hostname } from 'os';
import { User } from '../schemas/user.schema';

@Injectable()
export class SocketConnectionService {
  constructor(
    @InjectModel(SocketConnection.name)
    private socketConnectionModel: Model<SocketConnection>,
    @Inject(forwardRef(() => UserService)) private userService: UserService,
  ) {}

  async create(socket: Socket, user: User) {
    console.log(user);

    const connection = await this.socketConnectionModel.create({
      user: user._id,
      socketId: socket.id,
      serverHostname: hostname(),
      serverPort: environments.port,
    });

    if (!user.online) {
      user.online = true;

      await user.save();
    }

    return connection.populate('user');
  }

  getAll(user: User) {
    return this.socketConnectionModel.find({ user: user._id });
  }

  getAllByUsersID(usersID: string[]) {
    return this.socketConnectionModel.find({
      user: { $in: usersID },
    });
  }

  getBySocket(socket: Socket) {
    return this.socketConnectionModel
      .findOne({ socketId: socket.id })
      .populate('user');
  }

  async deleteAllConnections() {
    await this.socketConnectionModel.deleteMany({
      serverHostname: hostname(),
      serverPort: environments.port,
    });

    const users = await this.userService.getOnlineUsers();

    for (const user of users) {
      const connections = await this.getAll(user);

      if (connections.length === 0) {
        user.online = false;

        await user.save();
      }
    }
  }

  async delete(socket: Socket) {
    const connection = await this.getBySocket(socket);

    if (!connection) {
      return;
    }

    await this.socketConnectionModel.findByIdAndDelete(connection._id);

    const user = connection.user;

    const connections = await this.getAll(user);

    if (connections.length === 0) {
      user.online = false;

      await user.save();
    }

    return connection;
  }
}
