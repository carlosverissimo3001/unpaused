import { Module } from '@nestjs/common';
import { GameController } from './controllers/game.controller';
import { GameService } from './services/game.service';
import { GameStatsService } from './services/game-stats.service';
import { GameSessionRepository } from './repositories/game-session.repository';
import { AuthModule } from '../auth/auth.module';
import { PlaylistModule } from '../playlist/playlist.module';
import { SpotifyModule } from '../spotify/spotify.module';
import { TrackModule } from '../track/track.module';
import { UserPreferencesModule } from '../user-preferences/user-preferences.module';
import { StreakModule } from '../streak/streak.module';
import { PoolModule } from '../pool/pool.module';
import { DailyModule } from '../daily/daily.module';
import { ProvisioningSessionGuard } from '../utils/guards/provisioning-session.guard';
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
    UserPreferencesModule,
    StreakModule,
    PoolModule,
    DailyModule,
    BullModule.registerQueue({
      name: GAME_CLEANUP_QUEUE,
      defaultJobOptions: JOB_OPTIONS_WITH_BACKOFF,
    }),
  ],
  controllers: [GameController],
  providers: [
    GameService,
    GameStatsService,
    GameSessionRepository,
    GameStatsRepository,
    GameConsumer,
    ProvisioningSessionGuard,
  ],
})
export class GameModule {}
