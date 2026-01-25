import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { GameStatus } from "@prisma/client";
import { IsString, IsOptional, IsBoolean, IsEnum } from "class-validator";
import { GuessResult } from "../consts";

export const ROUND_DURATIONS = [0.1, 0.5, 1, 2, 4, 8];
export const MAX_ROUNDS = ROUND_DURATIONS.length;

export class StartGameDto {
  @ApiProperty({ example: "37i9dQZF1DXcBWIGoYBM5M" })
  @IsString()
  playlistId: string;
}

export class GuessDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  trackId?: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  skip: boolean = false;
}

export class GuessResultDto {
  @ApiProperty({ enum: GuessResult, description: "The result of the guess" })
  @IsEnum(GuessResult)
  result: GuessResult;

  @ApiProperty({ example: false })
  gameOver: boolean;

  @ApiProperty({ example: "won", enum: GameStatus })
  @IsEnum(GameStatus)
  status: GameStatus;

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

  @ApiProperty({ example: "https://i.scdn.co/image/...", required: false })
  albumImageUrl?: string;
}

export class GuessHistoryDto {
  @ApiPropertyOptional({ example: "7ouMYWpwJ422jRcDASAM9z", nullable: true, type: String })
  trackId?: string;

  @ApiPropertyOptional({ example: "Grenade", nullable: true, type: String })
  trackName?: string;

  @ApiPropertyOptional({ example: "Bruno Mars", nullable: true, type: String })
  @IsString()
  @IsOptional()
  artistName?: string;

  @ApiProperty({ enum: GuessResult, description: "The result of the guess" })
  @IsEnum(GuessResult)
  result: GuessResult;
}

export class GameStateDto {
  @ApiProperty({ example: "uuid-session-id" })
  sessionId: string;

  @ApiProperty({ example: 2 })
  currentRound: number;

  @ApiProperty({ example: 1.0 })
  snippetDuration: number;

  @ApiProperty({ example: "playing", enum: GameStatus })
  @IsEnum(GameStatus)
  status: GameStatus;

  @ApiProperty({ type: [GuessHistoryDto] })
  guesses: GuessHistoryDto[];

  @ApiPropertyOptional({ description: "The preview URL of the current track" , type: String})
  previewUrl?: string;

  @ApiProperty({ type: [TrackOptionDto] })
  trackOptions: TrackOptionDto[];

  @ApiProperty({ type: TrackOptionDto, nullable: true })
  answer: TrackOptionDto | null;
}
