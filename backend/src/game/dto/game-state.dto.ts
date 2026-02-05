import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { GameStatus } from "@prisma/client";
import { TrackOptionDto } from "@/track/dto/track-option.dto";
import { GuessHistoryDto } from "./guess/guess-history.dto";
import { MetaGameExtrasVo } from "../vos/game-extras.vo";

export class GameStateDto {
  @ApiProperty({ description: "The ID of the game session" })
  sessionId: string;

  @ApiProperty({ description: "The current round of the game" })
  currentRound: number;

  @ApiProperty({ description: "The duration of the current snippet" })
  snippetDuration: number;

  @ApiProperty({ description: "The status of the game", enum: GameStatus })
  status: GameStatus;

  @ApiProperty({ description: "The guesses of the game", type: GuessHistoryDto, isArray: true })
  guesses: GuessHistoryDto[];

  @ApiProperty({ description: "The preview URL of the current track" })
  previewUrl: string;

  @ApiPropertyOptional({ description: "The answer to the current track", type: TrackOptionDto })
  answer?: TrackOptionDto;

  @ApiPropertyOptional({
    description: "Optional personalized rank title (easter egg for special users)",
  })
  rankTitle?: string;

  @ApiPropertyOptional({
    description: "Optional personalized note (easter egg for special users)",
  })
  specialNote?: string;

  @ApiPropertyOptional({
    description: "Optional win easter eggs",
    required: false,
    type: MetaGameExtrasVo
  })
  meta?: MetaGameExtrasVo
}