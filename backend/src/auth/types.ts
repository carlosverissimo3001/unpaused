export type LoginStartResult = {
    authUrl: string;
    state: string;
  }
  
export type AuthMeResult = {
  spotifyUserId: string;
  displayName: string;
  isTrusted: boolean;
}
  