import { SetMetadata } from "@nestjs/common";
import { ENUM_ROLE_TYPE } from "../constants/role";

export const ROLES_KEY = "roles";
export const Roles = (...roles: ENUM_ROLE_TYPE[]) =>
  SetMetadata(ROLES_KEY, roles);
