import { MailerService } from '@nestjs-modules/mailer';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { join } from 'lodash';
import { Model } from 'mongoose';
import { randomString } from '../../../shared/utils/random-string';
import { ENUM_RECOVER_TYPE, Recover } from '../schemas/recover.schema';
import { User } from '../schemas/user.schema';
import { environments } from './../../../environments/environments';
import { urlPublic } from 'src/main';

@Injectable()
export class RecoverService {
  constructor(
    private mailerService: MailerService,

    @InjectModel(Recover.name) private recoveryModel: Model<Recover>,
  ) {}

  async create(user: User, type: ENUM_RECOVER_TYPE, lengthCode: number = 50) {
    await this.delete(user);

    return this.recoveryModel.create({
      code: randomString(lengthCode),
      type: type,
      owner: user._id,
      expiration: new Date(
        Date.now() + environments.recoverCodeExpiration * 1000,
      ),
    });
  }

  get(code: Recover['code']) {
    return this.recoveryModel.findOne({ code }).populate('owner');
  }

  delete(user: User): Promise<any> {
    return this.recoveryModel.deleteMany({ owner: user._id });
  }

  async twoFactorAuthentication(user: User) {
    const { code, expiration } = await this.create(
      user,
      ENUM_RECOVER_TYPE.TWO_AUTHENTICATION,
      5,
    );

    const url = environments.frontEndUrl;

    try {
      const sendMail = await this.mailerService.sendMail({
        to: user.email,
        subject: 'Trình xác thực (2FA)',
        template: join(urlPublic,'templates/twoAuthentication'),
        context: {
          name: user.username,
          url,
          code,
          expiration: Math.round(
            (expiration.getTime() - Date.now()) / 1000 / 60 / 60,
          ),
        },
      });
      return {
        message: sendMail ? true : false,
      };
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async validateCode(code: string, type: ENUM_RECOVER_TYPE) {
    const recover = await this.get(code);

    if (!recover)
      throw new HttpException(
        'Không tìm thấy mã khôi phục',
        HttpStatus.NOT_FOUND,
      );

    if (recover.expiration?.getTime() < Date.now()) {
      await this.delete(recover.owner);

      throw new HttpException('Mã khôi phục hết hạn', HttpStatus.NOT_FOUND);
    }

    if (recover.type !== type)
      throw new HttpException('Invalid Type Code', HttpStatus.BAD_REQUEST);

    await this.delete(recover.owner);

    return recover;
  }

  async sendEmailWithAttachment(to: string, nameFile: string, path: string) {
    return this.mailerService.sendMail({
      to: to,
      subject: 'Trình xác thực (2FA)',
      template: join(urlPublic,'templates/twoAuthentication'),
      context: {
        name: 'dasd',
        url: 'fds',
        code: '12312',
        expiration: Math.round(Date.now() / 1000 / 60 / 60),
      },
    });
  }
}
