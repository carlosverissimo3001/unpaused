import { Module } from "@nestjs/common";
import { AuthController } from "./controllers/auth.controller";
import { AuthService } from "./services/auth.service";
import { SpotifyService } from "./services/spotify.service";
import { SessionService } from "./services/session.service";
import { UserRepository } from "./repositories/user.repository";

@Module({
  controllers: [AuthController],
  providers: [AuthService, SpotifyService, SessionService, UserRepository],
  exports: [AuthService, SessionService],
})
export class AuthModule {}
