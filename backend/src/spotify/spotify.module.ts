import { Module } from '@nestjs/common';
import { SpotifyService } from './services/spotify.service';
import { SpotifyAppAuthService } from './services/spotify-app-auth.service';
import { PreviewScraperService } from '../track/services/preview-scraper.service';
import { PreviewLookupService } from '../track/services/preview-lookup.service';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [AuthModule, RedisModule],
  providers: [
    SpotifyService,
    SpotifyAppAuthService,
    PreviewScraperService,
    PreviewLookupService,
  ],
  exports: [SpotifyService, SpotifyAppAuthService, PreviewLookupService],
})
export class SpotifyModule {}
