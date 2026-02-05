export enum GuessResult {
  Correct = "CORRECT",
  Artist = "ARTIST",
  Album = "ALBUM",
  Wrong = "WRONG",
  Skip = "SKIP",
  ArtistAndAlbum = "ARTIST_AND_ALBUM",
}

export const ROUND_DURATIONS = [0.1, 0.5, 1, 2, 4, 8];
export const MAX_ROUNDS = ROUND_DURATIONS.length;

export const EMOJIS = [
  "🫰",
  "🙂‍↕️",
  "🙂‍↔️",
  "🫶",
  "❤️‍🩹",
  "🐈",
  "🌭",
  "🍫",
  "💐",  
  "\u{1F1E8}\u{1F1F1}", // Chile Flag
  "\u{1F1F5}\u{1F1F9}", // Portugal Flag
]