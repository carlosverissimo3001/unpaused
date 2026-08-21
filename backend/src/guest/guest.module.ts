import { Module } from '@nestjs/common';
import { RedisModule } from '@redis/redis.module';
import { SpotifyModule } from '../spotify/spotify.module';
import { TrackModule } from '../track/track.module';
import { GuestGameController } from './controllers/guest-game.controller';
import { GuestSearchController } from './controllers/guest-search.controller';
import { GuestGameService } from './services/guest-game.service';
import { GuestPlaylistService } from './services/guest-playlist.service';
import { GuestSearchService } from './services/guest-search.service';
import { GuestSessionService } from './services/guest-session.service';
import { GuestSessionGuard } from './guards/guest-session.guard';

@Module({
  imports: [RedisModule, SpotifyModule, TrackModule],
  controllers: [GuestGameController, GuestSearchController],
  providers: [
    GuestGameService,
    GuestPlaylistService,
    GuestSearchService,
    GuestSessionService,
    GuestSessionGuard,
  ],
})
export class GuestModule {}
