import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GameMode, GameStatus } from '@prisma/client';
import { GuessHistoryDto } from './guess/guess-history.dto';

export class GameHistoryEntryDto {
  @ApiProperty({ description: 'Game session ID' })
  id: string;

  @ApiProperty({
    description: 'Date (YYYY-MM-DD) from completedAt or createdAt',
  })
  date: string;

  @ApiProperty({ description: 'Game status', enum: GameStatus })
  status: GameStatus;

  @ApiPropertyOptional({
    description: 'Score 0-6, may be null if abandoned',
    type: Number,
  })
  score?: number;

  @ApiProperty({ description: 'The game mode', enum: GameMode })
  mode: GameMode;

  @ApiProperty({
    description: 'Guess history',
    type: GuessHistoryDto,
    isArray: true,
  })
  guesses: GuessHistoryDto[];

  @ApiProperty({ description: 'Track name (answer)' })
  trackName: string;

  @ApiProperty({ description: 'Artist name' })
  artistName: string;

  @ApiPropertyOptional({ description: 'Album image URL', type: String })
  albumImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Playlist/source name e.g. Liked Songs',
    type: String,
  })
  playlistName?: string;
}

export class GameHistoryDto {
  @ApiProperty({ type: GameHistoryEntryDto, isArray: true })
  items: GameHistoryEntryDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;
}
