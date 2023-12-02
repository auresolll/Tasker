import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from "@nestjs/common";
import {
  RecoverPasswordDto,
  ValidateRecoverCodeDto,
} from "../dtos/recover-password.dto";
import { UpdatePasswordDto } from "../dtos/update-password.dto";
import { ENUM_RECOVER_TYPE, Recover } from "../schemas/recover.schema";
import { User } from "../schemas/user.schema";
import { RecoverService } from "../services/recover.service";
import { UserService } from "../services/user.service";
import { environments } from "./../../../environments/environments";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MailerService } from "@nestjs-modules/mailer";
import path from "path";

@ApiTags("Recover")
@Controller("recover")
export class RecoverController {
  constructor(
    private userService: UserService,
    private recoverService: RecoverService,
    private mailerService: MailerService
  ) {}

  @ApiOperation({
    summary: "Xác thực mã khôi phục",
  })
  @Post("forget/:code")
  @ApiParam({
    name: "code",
    type: "string",
  })
  async forgetPasswordWithCode(
    @Param("code") code: Recover["code"],
    @Body() body: ValidateRecoverCodeDto
  ) {
    const recover = await this.recoverService.validateCode(
      code,
      ENUM_RECOVER_TYPE.FORGET_PASSWORD
    );

    if (body.password !== body.confirmPassword) {
      throw new HttpException(
        "Mật khẩu không giống nhau",
        HttpStatus.BAD_REQUEST
      );
    }

    const user = recover.owner;

    if (await user.validatePassword(body.password)) {
      throw new HttpException(
        "Không thể sử dụng mật khẩu hiện tại",
        HttpStatus.BAD_REQUEST
      );
    }

    user.password = body.password;

    await this.recoverService.delete(user);

    return this.userService.filterUser(await user.save());
  }

  @ApiOperation({
    summary: "Gửi mã khôi phục mật khẩu đến Mail",
  })
  @Post('send-code')
  async recoverPassword(@Body() body: RecoverPasswordDto) {
    const user = await this.userService.validateUserByEmail(body.email);

    const { code, expiration } = await this.recoverService.create(
      user,
      body.type
    );

    const url = environments.frontEndUrl;

    try {
      const sendMail = await this.mailerService.sendMail({
        to: user.email,
        subject: "Khôi phục mật khẩu của bạn",
        template: "./recover", // This will fetch /template/recover.hbs
        context: {
          name: user.username,
          url,
          code,
          expiration: Math.round(
            (expiration.getTime() - Date.now()) / 1000 / 60 / 60
          ),
        },
      });
      return {
        message: sendMail ? "Email đã được gửi" : "Email chưa được gửi",
      };
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({
    summary: "Thay đổi mật khẩu",
  })
  @Post("change/:code")
  @ApiParam({
    name: "code",
    type: "string",
  })
  async changePassword(
    @Param("code") code: Recover["code"],
    @Body() body: UpdatePasswordDto
  ) {
    const recover = await this.recoverService.validateCode(
      code,
      ENUM_RECOVER_TYPE.CHANGE_PASSWORD
    );

    if (body.password !== body.confirmPassword) {
      throw new HttpException(
        "Mật khẩu không giống nhau",
        HttpStatus.BAD_REQUEST
      );
    }

    const user = recover.owner;

    if (await user.validatePassword(body.currentPassword)) {
      throw new HttpException(
        "Mật khẩu hiện tại không đúng",
        HttpStatus.BAD_REQUEST
      );
    }

    if (await user.validatePassword(body.password)) {
      throw new HttpException(
        "Không thể sử dụng mật khẩu hiện tại",
        HttpStatus.BAD_REQUEST
      );
    }

    user.password = body.password;

    await this.recoverService.delete(user);

    return this.userService.filterUser(await user.save());
  }
}
