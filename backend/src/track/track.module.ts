import { AuthModule } from '@auth/auth.module';
import { TrackService } from './services/track.service';
import { TrackRepository } from './repositories/track.repository';
import { LastfmService } from './services/lastfm.service';
import { SpotifyModule } from '@spotify/spotify.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [AuthModule, SpotifyModule],
  providers: [TrackService, TrackRepository, LastfmService],
  exports: [TrackService, TrackRepository, LastfmService],
})
export class TrackModule {}
