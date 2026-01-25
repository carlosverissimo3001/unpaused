import { Module } from "@nestjs/common";
import { PlaylistsController } from "./controllers/playlists.controller";
import { PlaylistsService } from "./services/playlists.service";
import { AuthModule } from "../auth/auth.module";
import { SpotifyModule } from "../spotify/spotify.module";

@Module({
  imports: [AuthModule, SpotifyModule],
  controllers: [PlaylistsController],
  providers: [PlaylistsService],
  exports: [PlaylistsService],
})
export class PlaylistsModule {}
