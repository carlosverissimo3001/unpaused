import { Module } from '@nestjs/common';
import { GameController } from './controllers/game.controller';
import { SearchController } from './controllers/search.controller';
import { GameService } from './services/game.service';
import { SearchService } from './services/search.service';
import { GameSessionRepository } from './repositories/game-session.repository';
import { AuthModule } from '../auth/auth.module';
import { PlaylistModule } from '../playlist/playlist.module';
import { SpotifyModule } from '../spotify/spotify.module';
import { TrackModule } from '../track/track.module';
import { MessageModule } from '../message/message.module';
import { GameStatsRepository } from './repositories/game-stats.repository';
import { BullModule } from '@nestjs/bullmq';
import { GAME_CLEANUP_QUEUE, JOB_OPTIONS_WITH_BACKOFF } from '../consts';
import { GameConsumer } from './consumers/game.consumer';

@Module({
  imports: [
    AuthModule,
    PlaylistModule,
    SpotifyModule,
    TrackModule,
    MessageModule,
    BullModule.registerQueue({
      name: GAME_CLEANUP_QUEUE,
      defaultJobOptions: JOB_OPTIONS_WITH_BACKOFF,
    }),
  ],
  controllers: [GameController, SearchController],
  providers: [
    GameService,
    SearchService,
    GameSessionRepository,
    GameStatsRepository,
    GameConsumer,
  ],
})
export class GameModule {}
