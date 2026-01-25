import { UserSessionDto } from "../../auth/dto/user-session.dto";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";

export interface SpotifyClient {
  sdk: SpotifyApi;
  session: UserSessionDto;
}