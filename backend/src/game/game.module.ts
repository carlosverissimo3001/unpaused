import { Module } from "@nestjs/common";
import { GameController } from "./game.controller";
import { GameService } from "./game.service";
import { AuthModule } from "../auth/auth.module";
import { PlaylistsModule } from "../playlists/playlists.module";

@Module({
  imports: [AuthModule, PlaylistsModule],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
