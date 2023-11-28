import {
  ENUM_RECOVER_TYPE,
  Recover,
} from "./../../user/schemas/recover.schema";
import { RecoverService } from "./../../user/services/recover.service";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Request, Response } from "express";
import { Role } from "src/features/user/schemas/role.schema";
import { getAllRoles } from "src/shared/constants/role";
import { Roles } from "src/shared/utils/roles.decorator";
import { RolesGuard } from "src/shared/utils/roles.guard";
import { AuthNotRequired } from "../decorators/auth-not-required.decorator";
import { CurrentUser } from "../decorators/current-user.decorator";
import {
  LoginDto,
  ResponseLoginDto,
  ResponseRegisterDto,
} from "../dtos/login.dto";
import { RegisterDto } from "../dtos/register.dto";
import { ResponseGetMeDto } from "../dtos/response.dto";
import { JwtAuthGuard } from "../guard/jwt-auth.guard";
import { AuthService } from "../services/auth.service";
import { environments } from "./../../../environments/environments";
import { ENUM_ROLE_TYPE } from "./../../../shared/constants/role";
import { User } from "./../../user/schemas/user.schema";
import { UserService } from "./../../user/services/user.service";
import { GoogleAuthService } from "./../services/google-auth.service";
import { randomString } from "src/shared/utils/random-string";
import { Types } from "mongoose";

@ApiTags("Auth")
@ApiBearerAuth("accessToken")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private googleAuthService: GoogleAuthService,
    private recoverService: RecoverService
  ) {}

  @ApiOperation({ summary: "Đăng nhập bằng tài khoản - mật khẩu" })
  @ApiResponse({
    status: 200,
    description: "Trả về access-token khi đăng nhập thành công",
    type: ResponseLoginDto,
  })
  @Post("login")
  @AuthNotRequired()
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const user = await this.authService.validate(body.email, body.password);

    const { access_token, refresh_token } = await this.authService.login(user);

    if (!user.twoFactorAuthenticationSecret) {
      response.cookie("refresh_token", refresh_token, {
        httpOnly: true,
        domain: environments.frontEndDomain,
      });
      return {
        access_token,
      };
    }

    await this.recoverService.twoFactorAuthentication(user);
    return {
      message:
        "Tài khoản đã đăng ký trình xác thực vui lòng kiểm tra email và nhập mã",
    };
  }

  @ApiOperation({
    summary: "Xác thực 2FA bằng code",
  })
  @AuthNotRequired()
  @Post("2FA/:code")
  async verifiedTwoAuthentication(
    @Param("code") code: string,
    @Res({ passthrough: true }) response: Response
  ) {
    const verified: Recover = await this.recoverService.validateCode(
      code,
      ENUM_RECOVER_TYPE.TWO_AUTHENTICATION
    );
    const { access_token, refresh_token } = await this.authService.login(
      verified.owner
    );

    response.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      domain: environments.frontEndDomain,
    });
    return {
      access_token,
    };
  }

  @ApiOperation({
    summary: "Đăng nhập bằng access-token mạng xã hội qua BearerAuth",
  })
  @ApiResponse({
    status: 200,
    description: "Trả về access-token khi đăng nhập thành công",
    type: ResponseLoginDto,
  })
  @Post("google-login")
  @AuthNotRequired()
  async googleLogin(
    @CurrentUser() user: User,
    @Query("accessToken") accessToken: string,
    @Res({ passthrough: true }) response: Response
  ) {
    const { access_token, refresh_token } =
      await this.authService.loginWithThirdParty(
        "googleId",
        () => this.googleAuthService.getUser(accessToken),
        user
      );

    response.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      domain: environments.frontEndDomain,
    });

    return {
      access_token,
    };
  }

  @ApiOperation({
    summary: "Tạo mới access-token bằng cách gửi refresh-token qua BearerAuth",
  })
  @ApiResponse({
    status: 200,
    description: "Trả về access-token khi tạo mới thành công",
    type: ResponseLoginDto,
  })
  @Get("refresh-token")
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const refreshToken = request.cookies["refresh_token"];
    const { access_token, refresh_token } =
      await this.authService.loginWithRefreshToken(refreshToken);

    response.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      domain: environments.frontEndUrl,
    });

    return {
      access_token,
    };
  }

  @ApiOperation({
    summary: "Tạo mới tài khoản",
  })
  @ApiResponse({
    status: 200,
    description: "Trả về thông tin tài khoản khi tạo mới thành công",
    type: ResponseRegisterDto,
  })
  @Post("register")
  @AuthNotRequired()
  async register(@Body() body: RegisterDto) {
    if (await this.userService.getUserByEmail(body.email))
      throw new BadRequestException("Email đã tồn tại");

    const user = this.userService.filterUser(
      await this.userService.create({
        ...body,
        username: randomString(10),
        role: new Types.ObjectId(ENUM_ROLE_TYPE.CUSTOMER) as unknown as Role,
      })
    );
    return {
      message: "Đăng ký thành công",
      info: user,
    };
  }

  @ApiOperation({
    summary: "Đăng xuất toàn bộ thiết bị ngoại trừ thiết bị hiện tại",
  })
  @ApiResponse({
    status: 200,
    description: "Trả về access-token khi tạo đăng nhập thành công",
    type: ResponseLoginDto,
  })
  @UseGuards(JwtAuthGuard)
  @Delete("logout-from-all-devices")
  async logoutFromAllDevices(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response
  ) {
    user.generateSessionToken();

    await user.save();
    const { access_token, refresh_token } = await this.authService.login(user);

    response.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      domain: environments.frontEndUrl,
    });

    return {
      access_token,
    };
  }

  @Roles(...getAllRoles())
  @Get("me")
  @ApiOperation({
    summary:
      "Lấy thông tin tài khoản bằng cách gửi access-token qua BearerAuth",
  })
  @ApiResponse({
    status: 200,
    description: "Thông tin tài khoản",
    type: ResponseGetMeDto,
  })
  me(@CurrentUser() user: User) {
    // return this.userService.filterUser(user, ["email"]);
    return this.userService.validateUserById(user._id);
  }
}
