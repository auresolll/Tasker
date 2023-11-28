import {
  Module,
  OnModuleDestroy,
  OnModuleInit,
  forwardRef,
} from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { RecoverController } from "./controllers/recover.controller";
import { SettingsController } from "./controllers/settings.controller";
import { UserController } from "./controllers/user.controller";
import { UserGateway } from "./gateway/user.gateway";
import { RecoverService } from "./services/recover.service";
import { SocketConnectionService } from "./services/socket-connection.service";
import { UserService } from "./services/user.service";
import { BasketModule } from "../basket/basket.module";
import { ProductModule } from "../product/product.module";
import { Models } from "src/shared/constants/model";

@Module({
  imports: [
    Models,
    forwardRef(() => AuthModule),
    forwardRef(() => BasketModule),
    forwardRef(() => ProductModule),
  ],
  controllers: [
    UserController,
    RecoverController,
    SettingsController,
  ],
  providers: [
    UserService,
    RecoverService,
    UserGateway,
    SocketConnectionService,
  ],
  exports: [
    RecoverService,
    UserService,
    UserGateway,
    SocketConnectionService,
  ],
})
export class UserModule implements OnModuleInit, OnModuleDestroy {
  constructor(private socketConnectionService: SocketConnectionService) {}
  onModuleInit() {
    this.deleteConnections();
  }
  onModuleDestroy() {
    this.deleteConnections();
  }

  deleteConnections() {
    return this.socketConnectionService.deleteAllConnections();
  }
}
