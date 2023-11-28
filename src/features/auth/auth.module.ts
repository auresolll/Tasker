import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { AuthController } from './controllers/auth.controller';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { AuthService } from './services/auth.service';
import { GoogleAuthService } from './services/google-auth.service';

@Module({
    imports: [
        JwtModule.register({
            global: true,
        }),
        UserModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, GoogleAuthService, JwtAuthGuard],
    exports: [AuthService, JwtAuthGuard, JwtModule, UserModule],
})
export class AuthModule {}
