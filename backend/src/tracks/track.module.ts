import { AuthModule } from "@auth/auth.module"
import { TrackService } from "./services/track.service"
import { TrackRepository } from "./repositories/track.repository"
import { SpotifyModule } from "@spotify/spotify.module"
import { Module } from "@nestjs/common"

@Module({
    imports: [AuthModule, SpotifyModule],
    providers: [TrackService, TrackRepository],
    exports: [TrackService],
})

export class TrackModule {}