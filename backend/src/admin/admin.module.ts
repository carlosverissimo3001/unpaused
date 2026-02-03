import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminGuard } from "../utils/guards/admin-guard";
import { AuthModule } from "../auth/auth.module";
import { MessageModule } from "../messages/message.module";

@Module({
  imports: [AuthModule, MessageModule],
  controllers: [AdminController],
  providers: [AdminGuard],
})
export class AdminModule {}
