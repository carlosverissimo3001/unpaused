import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GameStatsRepository } from '../game/repositories/game-stats.repository';
import { StreakController } from './streak.controller';
import { StreakService } from './streak.service';
import { StreakQuizService } from './streak-quiz.service';
import { StreakQuizRepository } from './streak-quiz.repository';
import { TrustedUserGuard } from '../utils/guards/trusted-user-guard';

@Module({
  imports: [AuthModule],
  controllers: [StreakController],
  providers: [
    StreakService,
    StreakQuizService,
    StreakQuizRepository,
    GameStatsRepository,
    TrustedUserGuard,
  ],
  exports: [StreakQuizService],
})
export class StreakModule {}
