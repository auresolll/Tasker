import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { getClient } from "./get-client";
import { ROLES_KEY } from "./roles.decorator";
import { ENUM_ROLE_TYPE } from "../constants/role";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<ENUM_ROLE_TYPE[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (!requiredRoles) return true;

    const { user } = getClient(context);

    if (user && !user["role"]) return false;

    return requiredRoles.some((_role) => _role === String(user.role))
      ? true
      : false;
  }
}
