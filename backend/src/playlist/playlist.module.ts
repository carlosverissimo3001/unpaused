import { Module } from '@nestjs/common';
import { PlaylistController } from './controllers/playlist.controller';
import { PlaylistService } from './services/playlist.service';
import { AuthModule } from '../auth/auth.module';
import { SpotifyModule } from '../spotify/spotify.module';

@Module({
  imports: [AuthModule, SpotifyModule],
  controllers: [PlaylistController],
  providers: [PlaylistService],
  exports: [PlaylistService],
})
export class PlaylistModule {}
