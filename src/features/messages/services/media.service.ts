import { UserService } from "src/features/user/services/user.service";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";
import { Message } from "../schemas/messages.schema";
import { User } from "./../../user/schemas/user.schema";
import { CreateMediaDto } from "../dtos/create-media.dto";
import { get, toPlainObject } from "lodash";
import { ENUM_MEDIA_TYPE, Media } from "../schemas/media.schema";

@Injectable()
export class MediaService {
  private blockedFields: (keyof Message)[] = ["id", "recall"];
  constructor(
    @InjectModel(Media.name) private mediaModel: Model<Media>,
    private readonly userService: UserService
  ) {}

  unpopulatedFields = "-" + this.blockedFields.join(" -");

  async create(
    from: User,
    to: User,
    MediaName: string,
    url: string,
    type: ENUM_MEDIA_TYPE
  ) {
    const object = await this.mediaModel
      .create(toPlainObject(new CreateMediaDto(from, to, MediaName, url, type)))
      .catch((error) => {
        console.error(error);
        throw new HttpException(
          "Error when created message",
          HttpStatus.NOT_IMPLEMENTED
        );
      });

    return {
      ...object.toObject(),
      from: get(object.from, "_id", null),
      to: get(object.to, "_id", null),
    };
  }

  async getDirectMedia(
    from: User,
    to: User,
    limit = 30,
    before?: Date,
    type?: ENUM_MEDIA_TYPE
  ): Promise<Media[]> {
    const filter: FilterQuery<Media> = {
      createdAt: { $lte: before },
      from: from._id,
      to: to._id,
      type: type,
    };

    if (!type) {
      delete filter.type;
    }

    if (!before) {
      delete filter.createdAt;
    }

    return this.getStorage(filter, limit);
  }

  async getStorage(filter: FilterQuery<Media>, limit: number) {
    const result = await this.mediaModel
      .find(filter)
      .limit(limit)
      .sort({ createdAt: -1 });
    return this.getMedia(result);
  }

  getMedia(storage: Media[]): Media[] {
    return storage.sort(
      (a, b) => a["createdAt"].getTime() - b["createdAt"].getTime()
    );
  }
}
