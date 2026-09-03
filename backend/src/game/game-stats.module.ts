import { Module } from '@nestjs/common';
import { UserPreferencesModule } from '../user-preferences/user-preferences.module';
import { GameStatsRepository } from './repositories/game-stats.repository';
import { GameStatsService } from './services/game-stats.service';

/**
 * Stats stand on their own so that both the game and the streak can read them
 * without importing each other. Before this, each module provided the
 * repository itself and reached past the service to reach it.
 */
@Module({
  imports: [UserPreferencesModule],
  providers: [GameStatsService, GameStatsRepository],
  // The service only: exporting the repository would leave the door open to
  // the reach-through this module exists to close.
  exports: [GameStatsService],
})
export class GameStatsModule {}
