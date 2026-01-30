import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { GameStatus } from "@prisma/client";
import { TrackOptionDto } from "@tracks/dto/track-option.dto";
import { GuessHistoryDto } from "./guess-history.dto";

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
  
    @ApiPropertyOptional({ description: "The preview URL of the current track" , type: String})
    previewUrl?: string;
  
    @ApiPropertyOptional({ description: "The answer to the current track", type: TrackOptionDto })
    answer?: TrackOptionDto;
  }