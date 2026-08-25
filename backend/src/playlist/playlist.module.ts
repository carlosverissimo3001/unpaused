import { Module } from '@nestjs/common';
import { PlaylistController } from './controllers/playlist.controller';
import { PlaylistService } from './services/playlist.service';
import { AuthModule } from '../auth/auth.module';
import { SpotifyModule } from '../spotify/spotify.module';
import { SpotifyLinkedGuard } from '../utils/guards/spotify-linked.guard';

@Module({
  imports: [AuthModule, SpotifyModule],
  controllers: [PlaylistController],
  providers: [PlaylistService, SpotifyLinkedGuard],
  exports: [PlaylistService],
})
export class PlaylistModule {}
