import { GameMode } from '@prisma/client';

export type UpdateGameStatsParams = {
  userId: string;
  roundWon?: number;
  mode: GameMode;
};
