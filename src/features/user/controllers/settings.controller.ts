import { ObjectId } from "./../../../shared/mongoose/object-id";
import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Patch,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "src/features/auth/guard/jwt-auth.guard";
import { Roles } from "src/shared/utils/roles.decorator";
import { RolesGuard } from "src/shared/utils/roles.guard";
import {
  ResponseUpdateEmailDto,
  UpdateEmailDto,
} from "../dtos/update-email.dto";
import {
  ResponseUpdatePasswordDto,
  UpdatePasswordDto,
} from "../dtos/update-password.dto";
import { ResponseUpdateUsernameDto } from "../dtos/update-username.dto";
import { User } from "../schemas/user.schema";
import { UserService } from "../services/user.service";
import { ENUM_ROLE_TYPE, getAllRoles } from "./../../../shared/constants/role";
import { CurrentUser } from "./../../auth/decorators/current-user.decorator";
import { UpdateProfileDto } from "../dtos/update-profile.dto";
import { UpdateTwoFactorAuthenticationSecretDto } from "../dtos/update-two-authentication.dto";
import { UpdateRoleDto } from "../dtos/update-role.dto";
import { Types } from "mongoose";
import { Role } from "../schemas/role.schema";
import { AuthNotRequired } from "src/features/auth/decorators/auth-not-required.decorator";
import { NotFoundError } from "rxjs";

@ApiTags("Settings")
@Controller("settings")
@ApiBearerAuth("accessToken")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private userService: UserService) {}

  @Roles(...getAllRoles())
  @ApiOperation({ summary: "Cập nhật username" })
  @ApiResponse({ status: 200, type: ResponseUpdateUsernameDto })
  @Patch("username")
  async updateUsername(
    @CurrentUser() user: User,
    @Query("username") username: string
  ) {
    const usernameUser = await this.userService.getUserByName(username);

    if (usernameUser)
      throw new BadRequestException(
        "Username đã tồn tại, vui lòng chọn username khác"
      );

    user.username = username;

    await user.save();
    return {
      username: user.username,
    };
  }

  @Roles(...getAllRoles())
  @ApiOperation({
    summary:
      "Cập nhật email (Chỉ dành cho tài khoản đăng nhập bằng tài khoản - mật khẩu)",
  })
  @ApiResponse({ status: 200, type: ResponseUpdateEmailDto })
  @Patch("email")
  async updateEmail(@CurrentUser() user: User, @Query() query: UpdateEmailDto) {
    const emailUser = await this.userService.getUserByEmail(query.email);

    if (emailUser) throw new BadRequestException("Email đã tồn tại");

    user.email = query.email;

    await user.save();
    return {
      email: user.email,
    };
  }

  @Roles(...getAllRoles())
  @ApiOperation({ summary: "Cập nhật mật khẩu" })
  @ApiResponse({ status: 200, type: ResponseUpdatePasswordDto })
  @Patch("password")
  async updatePassword(
    @CurrentUser() user: User,
    @Body() body: UpdatePasswordDto
  ) {
    if (!user.isSocial && !(await user.validatePassword(body.currentPassword)))
      throw new BadRequestException("Mật khẩu hiện tại không khớp");

    if (body.password !== body.confirmPassword)
      throw new BadRequestException("Mật khẩu không khớp");

    if (await user.validatePassword(body.password))
      throw new BadRequestException(
        "Không thể thay đổi mật khẩu bằng mật khẩu hiện tại"
      );

    user.password = body.password;

    return {
      isPassword: (await user.save()) ? true : false,
    };
  }

  @Roles(...getAllRoles())
  @ApiOperation({ summary: "Cập nhật thông tin cá nhân" })
  @Put("profile")
  async updateProfile(
    @CurrentUser() user: User,
    @Body() body: UpdateProfileDto
  ) {
    const { avatar, bio, birthday, name, username, website } = body;
    user.avatar = avatar;
    user.bio = bio;
    user.birthday = birthday;
    user.name = name;
    user.username = username;
    user.website = website;
    return {
      isProfile: (await user.save()) ? true : false,
    };
  }

  @Roles(...getAllRoles())
  @ApiOperation({ summary: "Cập nhật trình xác thực" })
  @Patch("two-factor-authentication")
  async updateTwoFactorAuthentication(
    @CurrentUser() user: User,
    @Body() body: UpdateTwoFactorAuthenticationSecretDto
  ) {
    if (!user.activeMail)
      new BadGatewayException("Bạn phải xác thực mail trước");

    user.twoFactorAuthenticationSecret = body.status;
    return {
      isTwoFactorAuthenticationSecret: (await user.save()) ? true : false,
    };
  }

  @Roles(ENUM_ROLE_TYPE.ADMINISTRATION)
  @ApiOperation({ summary: "Phân quyền tài khoản" })
  @Patch("role")
  async updateRole(@CurrentUser() user: User, @Body() body: UpdateRoleDto) {
    if (!user.activeMail)
      new BadGatewayException("Bạn phải xác thực mail trước");

    const userObject = await this.userService.getUserById(
      new Types.ObjectId(body.userID)
    );

    if (!userObject) throw new NotFoundException("user not found");

    userObject.role = new Types.ObjectId(body.role) as unknown as Role;

    return {
      isRole: (await userObject.save()) ? true : false,
    };
  }
}
