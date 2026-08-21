import { Module } from '@nestjs/common';
import { SpotifyService } from './services/spotify.service';
import { SpotifyAppAuthService } from './services/spotify-app-auth.service';
import { PreviewScraperService } from '../track/services/preview-scraper.service';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [AuthModule, RedisModule],
  providers: [SpotifyService, SpotifyAppAuthService, PreviewScraperService],
  exports: [SpotifyService, SpotifyAppAuthService, PreviewScraperService],
})
export class SpotifyModule {}
