import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
} from "@nestjs/common";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { Token } from "../guard/jwt-auth.guard";
import { environments } from "./../../../environments/environments";
import { User } from "./../../user/schemas/user.schema";
import { UserService } from "./../../user/services/user.service";
import {
  GetSocialUserHandler,
  IAuth,
  TokenResponse,
} from "../interfaces/auth.interface";
import { randomString } from "src/shared/utils/random-string";

@Injectable()
export class AuthService implements IAuth {
  constructor(
    @Inject(forwardRef(() => UserService)) private userService: UserService,
    private jwtService: JwtService
  ) {}

  async validate(email: string, password: string) {
    const user = await this.userService.getUserByEmail(email);

    if (!user)
      throw new BadGatewayException({
        code: "EMAIL_404",
        message: "Người dùng không tồn tại",
      });

    if (!(await user.validatePassword(password)))
      throw new BadGatewayException({
        code: "PASSWORD_502",
        message: "Sai mật khẩu",
      });

    return user;
  }

  async login(user: User): Promise<TokenResponse> {
    const payload: Token = {
      sub: user._id,
      email: user.email,
    };

    let refresh_token: string;
    if (environments.token.accessTokenExpiration) {
      refresh_token = await this.jwtService.signAsync(
        payload,
        this.getRefreshTokenOptions(user)
      );
    }

    return {
      access_token: await this.jwtService.signAsync(
        payload,
        this.getAccessTokenOptions(user)
      ),
      refresh_token,
    };
  }

  async loginWithThirdParty(
    fieldId: keyof User,
    getSocialUser: GetSocialUserHandler,
    currentUser?: User,
    customName?: string
  ) {
    try {
      const { id, name, email } = await getSocialUser();

      const existentUser = await this.userService.getUserBy({
        [fieldId]: id,
      });

      if (existentUser && !currentUser) {
        return this.login(existentUser);
      }

      if (existentUser && currentUser) {
        throw new BadRequestException(`Google.${fieldId} đã tồn tại`);
      }

      if (!currentUser && (await this.userService.getUserByEmail(email))) {
        throw new BadRequestException("Email đã tồn tại");
      }

      if (currentUser) {
        currentUser[fieldId as string] = id;
        await currentUser.save();

        return this.login(currentUser);
      }

      const user = await this.userService.create({
        name: customName ? customName : name,
        username: randomString(5),
        email: email,
        activeMail: true,
        twoFactorAuthenticationSecret: false,
        [fieldId]: id,
      });

      return this.login(user);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException("Access-token không hợp lệ");
    }
  }

  async loginWithRefreshToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.decode(refreshToken) as Token;

      if (!decoded) {
        throw new Error();
      }

      const user = await this.userService.validateUserById(decoded.sub);

      await this.jwtService.verifyAsync<Token>(
        refreshToken,
        this.getRefreshTokenOptions(user)
      );

      return this.login(user);
    } catch {
      throw new UnauthorizedException("Token không hợp lệ");
    }
  }

  getRefreshTokenOptions(user: User): JwtSignOptions {
    return this.getTokenOptions("refresh", user);
  }

  getAccessTokenOptions(user: User): JwtSignOptions {
    return this.getTokenOptions("access", user);
  }

  private getTokenOptions(type: "refresh" | "access", user: User) {
    const options: JwtSignOptions = {
      secret: environments.token[type + "TokenSecret"] + user.sessionToken,
    };

    const expiration = environments.token[type + "TokenExpiration"];

    if (expiration) {
      options.expiresIn = expiration;
    }

    return options;
  }
}
