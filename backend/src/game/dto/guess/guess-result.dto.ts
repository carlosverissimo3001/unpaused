import { ApiProperty } from "@nestjs/swagger";
import { GuessResult } from "../../consts";
import { GameStatus } from "@prisma/client";

export class GuessResultDto {
  @ApiProperty({ enum: GuessResult, description: "The result of the guess" })
  result: GuessResult;

  @ApiProperty({ description: "Whether the game is over" })
  gameOver: boolean;

  @ApiProperty({ description: "The status of the game", enum: GameStatus })
  status: GameStatus;

  @ApiProperty({ description: "The current round of the game" })
  currentRound: number;

  @ApiProperty({ description: "The duration of the current snippet" })
  snippetDuration: number;

  @ApiProperty({
    description: "Optional personalized rank title (easter egg)",
    required: false,
  })
  rankTitle?: string;

  @ApiProperty({
    description: "Optional personalized note (easter egg)",
    required: false,
  })
  specialNote?: string;

  @ApiProperty({
    description: "Optional meta flags (e.g. showHeart for special win celebration)",
    required: false,
  })
  meta?: { showHeart?: boolean };
}