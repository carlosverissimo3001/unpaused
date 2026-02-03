import type { TrackOptionDto } from "@/sdk";
import type { GuessHistoryDto } from "@/sdk";

/**
 * Normalized game state used by the shared GamePage UI.
 * Both playlist and daily modes provide this shape.
 */
export interface GameViewState {
  sessionId: string;
  currentRound: number;
  snippetDuration: number;
  status: string;
  guesses: GuessHistoryDto[];
  previewUrl?: string | null;
  answer?: TrackOptionDto | null;
  trackOptions?: TrackOptionDto[];
}
