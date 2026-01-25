import { Module } from "@nestjs/common";
import { GameController } from "./game.controller";
import { GameService } from "./game.service";
import { GameSessionRepository } from "./repositories/game-session.repository";
import { AuthModule } from "../auth/auth.module";
import { PlaylistsModule } from "../playlists/playlists.module";
import { TrackModule } from "../tracks/track.module";

@Module({
  imports: [AuthModule, PlaylistsModule, TrackModule],
  controllers: [GameController],
  providers: [GameService, GameSessionRepository],
})
export class GameModule {}
