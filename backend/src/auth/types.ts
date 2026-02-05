export type LoginStartResult = {
  authUrl: string;
  state: string;
};

export type AuthMeResult = {
  spotifyUserId: string;
  displayName: string;
  isTrusted: boolean;
};

export type SpotifyTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in ms
};

export type SpotifyTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export type SpotifyProfile = {
  id: string;
  display_name: string;
  email: string;
};
