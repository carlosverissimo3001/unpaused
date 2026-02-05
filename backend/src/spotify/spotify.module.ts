import { Module } from '@nestjs/common';
import { SpotifyService } from './services/spotify.service';
import { PreviewScraperService } from '../track/services/preview-scraper.service';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [AuthModule, RedisModule],
  providers: [SpotifyService, PreviewScraperService],
  exports: [SpotifyService, PreviewScraperService],
})
export class SpotifyModule {}
