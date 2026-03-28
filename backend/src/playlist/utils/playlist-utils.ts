import { Playlist, SimplifiedPlaylist, Track } from '@spotify/web-api-ts-sdk';
import { UserSessionDto } from '../../auth/dto/user-session.dto';
import { GetPlaylistsDto } from '../dto/get-playlists-dto';
import { PlaylistDto } from '../dto/playlist.dto';
import { getFirstImage } from '../../utils/utils';
import { PLAYLIST_SORT_BY } from '../consts';

/**
 * Type for Spotify API response that may use either old (tracks) or new (items) field names.
 * Spotify renamed tracks -> items in February 2026, but SDK types haven't been updated yet.
 */
type PlaylistWithItems = (Playlist<Track> | SimplifiedPlaylist) & {
  items?: { total?: number };
};

/**
 * Lite Version: For browsing lists of playlists
 */
export function mapPlaylistLite(
  playlist: Playlist<Track> | SimplifiedPlaylist,
): PlaylistDto {
  // Handle both new API (items) and old SDK types (tracks) for Feb 2026 API change
  const playlistWithItems = playlist as PlaylistWithItems;
  const totalTracks =
    playlistWithItems.items?.total ?? playlist.tracks?.total ?? 0;

  return {
    id: playlist.id,
    name: playlist.name,
    description: playlist.description || '',
    imageUrl: getFirstImage(playlist.images),
    owner: playlist.owner?.display_name || 'Unknown',
    totalTracks,
    isPublic: playlist.public ?? true,
    externalUrl: playlist.external_urls?.spotify || '',
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
  session: UserSessionDto,
): SimplifiedPlaylist[] {
  return playlists.filter((p) => {
    // Spotify only allows playing user-owned playlists
    if (p.owner?.id !== session.spotifyUserId) {
      return false;
    }
    if (filters.onlyPublic && !p.public) {
      return false;
    }
    if (filters.onlyPrivate && p.public) {
      return false;
    }
    return true;
  });
}

export function sortPlaylists(
  playlists: PlaylistDto[],
  sortBy: PLAYLIST_SORT_BY,
): PlaylistDto[] {
  if (sortBy === PLAYLIST_SORT_BY.DEFAULT) {
    return playlists;
  }

  return [...playlists].sort((a, b) => {
    if (sortBy === PLAYLIST_SORT_BY.NAME) {
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    }
    // tracks — descending
    return b.totalTracks - a.totalTracks;
  });
}
