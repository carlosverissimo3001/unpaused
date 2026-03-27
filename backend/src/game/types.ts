import { GameMode, Track } from '@prisma/client';
import { GameStatsEntity } from './entities/game-stats.entity';
import { GameSessionEntity } from './entities/game-session.entity';
import { GuessResult } from './consts';
import { GuessDto } from './dto/guess/guess.dto';

export type UpdateGameStatsParams = {
  userId: string;
  lastGameRound: number;
  mode: GameMode;
  timezone: string;
};

export type UpdateDailyStatsParams = {
  userId: string;
  dailyStats: GameStatsEntity;
  dailyDist: number[];
  timezone: string;
};

export type AddGuessToHistoryParams = {
  game: GameSessionEntity;
  result: GuessResult;
  actual: Track;
  guess: GuessDto;
};

export enum HintType {
  GENRE = 'GENRE',
  DECADE = 'DECADE',
  ALBUM = 'ALBUM',
  POPULARITY = 'POPULARITY',
}
