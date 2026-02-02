import { GuessHistoryDtoResultEnum } from "@/sdk/models/GuessHistoryDto";

export const GUESS_RESULT_STYLE: Record<
  string,
  { label: string; barClass: string; cardClass: string; badgeClass: string }
> = {
  [GuessHistoryDtoResultEnum.Correct]: {
    label: "Correct",
    barClass: "bg-green-500",
    cardClass: "bg-green-500/20 border-green-500/50",
    badgeClass: "bg-green-500/30 text-green-300 border-green-500/60",
  },
  [GuessHistoryDtoResultEnum.Artist]: {
    label: "Same artist",
    barClass: "bg-yellow-500",
    cardClass: "bg-yellow-500/20 border-yellow-500/50",
    badgeClass: "bg-yellow-500/30 text-yellow-200 border-yellow-500/60",
  },
  [GuessHistoryDtoResultEnum.Album]: {
    label: "Same album",
    barClass: "bg-amber-500",
    cardClass: "bg-amber-500/20 border-amber-500/50",
    badgeClass: "bg-amber-500/30 text-amber-200 border-amber-500/60",
  },
  [GuessHistoryDtoResultEnum.ArtistAndAlbum]: {
    label: "Same artist & album",
    barClass: "bg-orange-500",
    cardClass: "bg-orange-500/20 border-orange-500/50",
    badgeClass: "bg-orange-500/30 text-orange-200 border-orange-500/60",
  },
  [GuessHistoryDtoResultEnum.Wrong]: {
    label: "Wrong",
    barClass: "bg-red-500",
    cardClass: "bg-red-500/20 border-red-500/50",
    badgeClass: "bg-red-500/30 text-red-200 border-red-500/60",
  },
  [GuessHistoryDtoResultEnum.Skip]: {
    label: "Skipped",
    barClass: "bg-gray-500",
    cardClass: "bg-gray-500/20 border-gray-500/50",
    badgeClass: "bg-gray-500/30 text-gray-300 border-gray-500/60",
  },
};

export function getGuessResultStyle(result: string) {
  return GUESS_RESULT_STYLE[result] ?? GUESS_RESULT_STYLE[GuessHistoryDtoResultEnum.Wrong];
}
