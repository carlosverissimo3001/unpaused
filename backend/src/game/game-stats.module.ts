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
  exports: [GameStatsService, GameStatsRepository],
})
export class GameStatsModule {}
