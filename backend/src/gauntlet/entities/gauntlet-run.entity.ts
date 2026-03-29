import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  GauntletDifficulty,
  GauntletEndReason,
  GauntletRunStatus,
} from '@prisma/client';
import { TrackEntity } from '../../track/entities/track.entity';

export class GauntletRunEntity {
  @ApiProperty({ description: 'The ID of the gauntlet run' })
  id: string;

  @ApiProperty({ description: 'The ID of the user' })
  userId: string;

  @ApiProperty({ description: 'Consecutive correct guesses' })
  score: number;

  @ApiProperty({
    description: 'The status of the gauntlet run',
    enum: GauntletRunStatus,
  })
  status: GauntletRunStatus;

  @ApiProperty({
    description: 'The difficulty of the run',
    enum: GauntletDifficulty,
  })
  difficulty: GauntletDifficulty;

  @ApiPropertyOptional({
    description: 'The reason the run ended',
    enum: GauntletEndReason,
    type: String,
  })
  endReason?: GauntletEndReason;

  @ApiProperty({
    description: 'IDs of tracks already used in this run',
    type: String,
    isArray: true,
  })
  trackIds: string[];

  @ApiPropertyOptional({
    description: 'The ID of the current track being guessed',
    type: String,
  })
  currentTrackId?: string;

  @ApiPropertyOptional({
    description: 'The current track being guessed',
  })
  currentTrack?: TrackEntity;

  @ApiProperty({ description: 'When the run was created' })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'When the run was completed',
    type: Date,
  })
  completedAt?: Date;
}
