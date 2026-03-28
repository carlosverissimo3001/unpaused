import { Track } from '@prisma/client';
import { GameSessionEntity } from './entities/game-session.entity';
import { GuessResult } from './consts';
import { GuessDto } from './dto/guess/guess.dto';

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
