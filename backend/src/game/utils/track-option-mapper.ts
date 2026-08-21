import { Track } from '@spotify/web-api-ts-sdk';
import { normalizeText } from '../../utils/text';
import { getFirstImage } from '../../utils/utils';
import { TrackOptionDto } from '../../track/dto/track-option.dto';

/**
 * Maps a raw Spotify SDK track to the guess-dropdown option shape.
 * Shared by the authenticated and guest search services - the Spotify track
 * shape is identical whether it came from a user token or an app token.
 */
export function mapSpotifyTrackToOption(track: Track): TrackOptionDto {
  const artist = track.artists?.[0]?.name ?? 'Unknown Artist';
  const name = track.name ?? '';
  const albumImageUrl = track.album?.images?.length
    ? getFirstImage(track.album.images)
    : undefined;

  return {
    id: track.id,
    name,
    normalizedName: normalizeText(name),
    artist,
    normalizedArtist: normalizeText(artist),
    albumImageUrl: albumImageUrl || undefined,
    albumName: track.album?.name ?? undefined,
  };
}
