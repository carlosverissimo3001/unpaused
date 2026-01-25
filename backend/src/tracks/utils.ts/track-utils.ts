import { Track } from "@spotify/web-api-ts-sdk";
import { getFirstImage } from "@utils/utils";
import { TrackDto } from "@playlists/dto/track.dto";

/**
 * Map Spotify API track to internal DTO
 * @param track - The Spotify track
 * @returns The track DTO
 */
export function mapTrack(track: Track): TrackDto {
    return {
      id: track.id,
      name: track.name,
      artists: track.artists.map(a => a.name),
      primaryArtist: track.artists[0]?.name || "Unknown Artist",
      popularity: track.popularity,
      albumName: track.album.name,
      imageUrl: getFirstImage(track.album.images),
      durationMs: track.duration_ms,
      externalUrl: track.external_urls.spotify,
      previewUrl: track.preview_url ?? undefined,
      isPlayable: track.is_playable ?? false,
      isExplicit: track.explicit,
    };
}     