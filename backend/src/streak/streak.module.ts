import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UserPreferencesModule } from '../user-preferences/user-preferences.module';
import { GameStatsRepository } from '../game/repositories/game-stats.repository';
import { StreakController } from './controllers/streak.controller';
import { StreakService } from './services/streak.service';
import { StreakQuizService } from './services/streak-quiz.service';
import { StreakQuizRepository } from './repositories/streak-quiz.repository';
import { TrustedUserGuard } from '../utils/guards/trusted-user-guard';

@Module({
  imports: [AuthModule, UserPreferencesModule],
  controllers: [StreakController],
  providers: [
    StreakService,
    StreakQuizService,
    StreakQuizRepository,
    GameStatsRepository,
    TrustedUserGuard,
  ],
  exports: [StreakService, StreakQuizService],
})
export class StreakModule {}
