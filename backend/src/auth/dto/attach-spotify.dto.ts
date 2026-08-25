export class AttachSpotifyDto {
  spotifyUserId: string;
  avatarUrl?: string;
  country?: string;
  /** Only applied over a name we generated; a chosen one is left alone. */
  displayName?: string;
}
