import { Playlist, SimplifiedPlaylist, Track } from "@spotify/web-api-ts-sdk";
import { UserSessionDto } from "../../auth/dto/user-session.dto";
import { GetPlaylistsDto } from "../dto/get-playlists-dto";
import { PlaylistDto } from "../dto/playlist.dto";
import { getFirstImage } from "../../utils/utils";


/**
 * Lite Version: For browsing lists of playlists
 */
export function mapPlaylistLite(
  playlist: Playlist<Track> | SimplifiedPlaylist
): PlaylistDto {
  return {
    id: playlist.id,
    name: playlist.name,
    description: playlist.description || "",
    imageUrl: getFirstImage(playlist.images),
    owner: playlist.owner?.display_name || "Unknown",
    totalTracks: playlist.tracks?.total || 0,
    isPublic: playlist.public ?? true,
    externalUrl: playlist.external_urls?.spotify || "",
  };
}



/**
 * Apply filters to a list of playlists
 * @param playlists - The Spotify playlists
 * @param filters - The filters to apply
 * @param session - The user session
 * @returns The filtered playlists
 */
export function applyFilters(
  playlists: SimplifiedPlaylist[],
  filters: GetPlaylistsDto,
  session: UserSessionDto
): SimplifiedPlaylist[] {
  return playlists.filter((p) => {
    if (!filters.includePrivate && !p.public) {
      return false;
    }
    if (filters.onlyUserOwned) {
      return p.owner?.display_name === session.displayName;
    }
    return true;
  });
}
