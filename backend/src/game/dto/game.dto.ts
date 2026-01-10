import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean } from "class-validator";

export const ROUND_DURATIONS = [0.1, 0.5, 1, 2, 4, 8];
export const MAX_ROUNDS = ROUND_DURATIONS.length;

export class StartGameDto {
  @ApiProperty({ example: "37i9dQZF1DXcBWIGoYBM5M" })
  @IsString()
  playlistId: string;
}

export class GuessDto {
  @ApiProperty({ example: "7ouMYWpwJ422jRcDASAM9z", required: false })
  @IsString()
  @IsOptional()
  trackId?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  skip?: boolean;
}

export class GuessResultDto {
  @ApiProperty({ enum: ["correct", "artist", "wrong", "skip"] })
  result: "correct" | "artist" | "wrong" | "skip";

  @ApiProperty({ example: false })
  gameOver: boolean;

  @ApiProperty({ example: "won", enum: ["playing", "won", "lost"] })
  status: "playing" | "won" | "lost";

  @ApiProperty({ example: 2 })
  currentRound: number;

  @ApiProperty({ example: 1.0 })
  snippetDuration: number;
}

export class TrackOptionDto {
  @ApiProperty({ example: "7ouMYWpwJ422jRcDASAM9z" })
  id: string;

  @ApiProperty({ example: "Grenade" })
  name: string;

  @ApiProperty({ example: "Bruno Mars" })
  artist: string;
}

export class GuessHistoryDto {
  @ApiProperty({ example: "7ouMYWpwJ422jRcDASAM9z", nullable: true })
  trackId: string | null;

  @ApiProperty({ example: "Grenade", nullable: true })
  trackName: string | null;

  @ApiProperty({ example: "Bruno Mars", nullable: true })
  artistName: string | null;

  @ApiProperty({ enum: ["correct", "artist", "wrong", "skip"] })
  result: "correct" | "artist" | "wrong" | "skip";
}

export class GameStateDto {
  @ApiProperty({ example: "uuid-session-id" })
  sessionId: string;

  @ApiProperty({ example: 2 })
  currentRound: number;

  @ApiProperty({ example: 1.0 })
  snippetDuration: number;

  @ApiProperty({ example: "playing", enum: ["playing", "won", "lost"] })
  status: "playing" | "won" | "lost";

  @ApiProperty({ type: [GuessHistoryDto] })
  guesses: GuessHistoryDto[];

  @ApiProperty({ example: "https://p.scdn.co/mp3-preview/..." })
  previewUrl: string | null;

  @ApiProperty({ type: [TrackOptionDto] })
  trackOptions: TrackOptionDto[];

  @ApiProperty({ type: TrackOptionDto, nullable: true })
  answer: TrackOptionDto | null;
}

export class DailyStateDto extends GameStateDto {
  @ApiProperty({ example: "2024-01-15" })
  date: string;

  @ApiProperty({ example: "Chill Vibes" })
  playlistName: string;

  @ApiProperty({ example: false })
  alreadyPlayed: boolean;

  @ApiProperty({ nullable: true })
  previousResult: {
    guesses: GuessHistoryDto[];
    score: number;
    wonAt: number | null;
  } | null;
}
