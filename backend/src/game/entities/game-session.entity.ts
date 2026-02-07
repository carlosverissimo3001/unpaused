import { GameMode, GameStatus } from '@prisma/client';
import { GuessHistoryDto } from '../dto/guess/guess-history.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GameSessionEntity {
  @ApiProperty({ description: 'The ID of the game session' })
  id: string;

  @ApiPropertyOptional({ description: 'The ID of the user' })
  userId?: string;

  @ApiProperty({ description: 'The ID of the playlist' })
  playlistId: string;

  @ApiProperty({ description: 'The game mode' })
  mode: GameMode;

  @ApiProperty({ description: 'The ID of the track' })
  trackId: string;

  @ApiProperty({ description: 'The current round of the game' })
  currentRound: number;

  @ApiProperty({
    description: 'The guesses of the game',
    type: GuessHistoryDto,
    isArray: true,
  })
  guesses: GuessHistoryDto[];

  @ApiProperty({ description: 'The status of the game', enum: GameStatus })
  status: GameStatus;

  @ApiProperty({ description: 'The date the game was created' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'The date the game was completed' })
  completedAt?: Date;

  @ApiPropertyOptional({ description: 'The score of the game', type: Number })
  score?: number;
}
