import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoomStatus } from '@prisma/client';

export class ScoreboardPlayerRoundDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  displayName: string;

  @ApiPropertyOptional({ type: String })
  avatarUrl?: string;

  @ApiProperty({ description: 'Score for this round (0-6)' })
  score: number;

  @ApiProperty({ description: 'Number of guesses used' })
  guessCount: number;

  @ApiProperty({ description: 'Whether the player won this round' })
  won: boolean;
}

export class ScoreboardRoundDto {
  @ApiProperty({ description: 'Round index (0-based)' })
  roundIndex: number;

  @ApiProperty({ type: [ScoreboardPlayerRoundDto] })
  players: ScoreboardPlayerRoundDto[];

  @ApiPropertyOptional({ description: 'Track name (after round complete)' })
  trackName?: string;

  @ApiPropertyOptional({ description: 'Artist name (after round complete)' })
  artistName?: string;

  @ApiPropertyOptional({ description: 'Album image URL' })
  albumImageUrl?: string;
}

export class ScoreboardPlayerTotalDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  displayName: string;

  @ApiPropertyOptional({ type: String })
  avatarUrl?: string;

  @ApiProperty({ description: 'Total score across all rounds' })
  totalScore: number;
}

export class ScoreboardDto {
  @ApiProperty({
    description: 'Per-round scores (only for rounds the caller has completed)',
    type: [ScoreboardRoundDto],
  })
  rounds: ScoreboardRoundDto[];

  @ApiProperty({
    description: 'Total scores per player',
    type: [ScoreboardPlayerTotalDto],
  })
  standings: ScoreboardPlayerTotalDto[];

  @ApiProperty({ enum: RoomStatus })
  roomStatus: RoomStatus;

  @ApiProperty({
    description: 'Whether all rounds are complete for all players',
  })
  isComplete: boolean;
}
