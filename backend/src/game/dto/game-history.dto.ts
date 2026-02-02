import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { GameStatus } from "@prisma/client";
import { GuessHistoryDto } from "./guess-history.dto";

export class GameHistoryEntryDto {
  @ApiProperty({ description: "Game session ID" })
  id: string;

  @ApiProperty({ description: "Date (YYYY-MM-DD) from completedAt or createdAt" })
  date: string;

  @ApiProperty({ description: "Game status", enum: GameStatus })
  status: GameStatus;

  @ApiPropertyOptional({ description: "Score 0-6 if completed", type: Number })
  score?: number;

  @ApiProperty({ description: "Whether the game was daily" })
  isDaily: boolean;

  @ApiProperty({ description: "Guess history", type: GuessHistoryDto, isArray: true })
  guesses: GuessHistoryDto[];

  @ApiProperty({ description: "Track name (answer)" })
  trackName: string;

  @ApiProperty({ description: "Artist name" })
  artistName: string;

  @ApiPropertyOptional({ description: "Album image URL", type: String })
  albumImageUrl?: string;

  @ApiPropertyOptional({ description: "Playlist/source name e.g. Liked Songs", type: String })
  playlistName?: string;
}

export class GameHistoryDto {
  @ApiProperty({ type: GameHistoryEntryDto, isArray: true })
  items: GameHistoryEntryDto[];

  @ApiProperty({ description: "Total count" })
  total: number;
}
