import { ApiProperty } from '@nestjs/swagger';

export class ShareResultDto {
  @ApiProperty({ description: 'Date (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Score 0-6' })
  score: number;

  @ApiProperty({ description: 'Guess pattern e.g. 🟥🟨🟩' })
  guessPattern: string;

  @ApiProperty({ description: 'Track name' })
  trackName: string;

  @ApiProperty({ description: 'Artist name' })
  artistName: string;

  @ApiProperty({ description: 'Pre-formatted share text' })
  shareText: string;

  @ApiProperty({ description: 'Game number (days since epoch or similar)' })
  gameNumber: number;
}
