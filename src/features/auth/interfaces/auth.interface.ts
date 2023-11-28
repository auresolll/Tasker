import { JwtSignOptions } from "@nestjs/jwt";
import { User } from "./../../user/schemas/user.schema";

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface SocialUser {
  id: number | string;
  name: string;
  email: string;
}

export type GetSocialUserHandler = () => Promise<Partial<SocialUser>>;

export interface IAuth {
  validate(email: string, password: string): Promise<User>;
  login(user: User): Promise<TokenResponse>;
  loginWithThirdParty(
    fieldId: keyof User,
    getSocialUser: GetSocialUserHandler,
    currentUser?: User,
    customName?: string
  ): Promise<TokenResponse>;
  loginWithRefreshToken(refreshToken: string): Promise<TokenResponse>;
  getRefreshTokenOptions(user: User): JwtSignOptions;
  getAccessTokenOptions(user: User): JwtSignOptions;
}
