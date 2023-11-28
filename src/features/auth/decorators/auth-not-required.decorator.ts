import { SetMetadata } from '@nestjs/common';

export const AUTH_NOT_REQUIRED = 'AUTH_NOT_REQUIRED';

export const AuthNotRequired = () => SetMetadata(AUTH_NOT_REQUIRED, true);
