import { TrackMetadataVo } from '../../track/vo/track-metadata.vo';
import { TrackEntity } from '../../track/entities/track.entity';
import { getDecade } from 'date-fns';
import { normalizeTrackNameForMatch } from '../../utils/text';
import { HintDto } from '../dto/hint/hint.dto';
import { HintType } from '../types';
import { isDescriptiveTag } from '../../track/utils/lastfm-tags';

type HintProducer = (
  track: TrackEntity,
  metadata: TrackMetadataVo,
) => Omit<HintDto, 'round'> | null;

const genreHint: HintProducer = (track, metadata) => {
  const rawTags = metadata.lastfm?.tags;
  if (!rawTags?.length) {
    return null;
  }

  // Last.fm tags are free text, so plenty of them are the artist or the song
  // rather than a genre. Normalized, since "Rihanna" and "rihanna!" are the
  // same giveaway.
  const forbidden = new Set(
    [track.name, ...track.allArtists].map((v) =>
      normalizeTrackNameForMatch(v).toLowerCase(),
    ),
  );
  // Filtered here as well as on the way in, because tags are cached on the
  // track and the ones already stored were never checked.
  const tags = rawTags.filter(
    (t) =>
      isDescriptiveTag(t) &&
      !forbidden.has(normalizeTrackNameForMatch(t).toLowerCase()),
  );

  // Every tag was a giveaway, so there is no hint to give.
  if (tags.length === 0) {
    return null;
  }

  return { type: HintType.GENRE, label: 'Genre', value: tags.join(', ') };
};

const decadeHint: HintProducer = (track) => {
  if (!track.releaseYear) {
    return null;
  }
  const decade = getDecade(new Date(track.releaseYear, 0, 1));
  return { type: HintType.DECADE, label: 'Decade', value: `${decade}s` };
};

const popularityHint: HintProducer = (_track, metadata) => {
  const playcount = metadata.lastfm?.playcount;
  if (!playcount) {
    return null;
  }
  const formatted =
    playcount >= 1_000_000
      ? `${(playcount / 1_000_000).toFixed(1)}M`
      : playcount >= 1_000
        ? `${(playcount / 1_000).toFixed(0)}K`
        : `${playcount}`;
  return {
    type: HintType.POPULARITY,
    label: 'Plays',
    value: `${formatted} on Last.fm`,
  };
};

const albumHint: HintProducer = (track) => {
  if (!track.albumName) {
    return null;
  }

  const album = normalizeTrackNameForMatch(track.albumName).toLowerCase();
  const song = normalizeTrackNameForMatch(track.name).toLowerCase();
  if (!album || !song || album.includes(song)) {
    return null;
  }

  return { type: HintType.ALBUM, label: 'Album', value: track.albumName };
};

/**
 * Ordered list of hint producers. Each round reveals the next available hint.
 */
const HINT_PRODUCERS: HintProducer[] = [
  genreHint,
  decadeHint,
  popularityHint,
  albumHint,
];

/**
 * Builds the list of hints visible up to and including `currentRound`.
 * Round 0 = no hints. Round 1 = first available hint, etc.
 * Skips hints where data is missing and moves to the next producer.
 */
export function buildHintsForRound(
  track: TrackEntity,
  currentRound: number,
): HintDto[] {
  if (currentRound <= 0) {
    return [];
  }

  const metadata = track.metadata ?? {};
  const hints: HintDto[] = [];
  let revealedCount = 0;

  for (const producer of HINT_PRODUCERS) {
    if (revealedCount >= currentRound) {
      break;
    }

    const result = producer(track, metadata);
    if (result) {
      revealedCount++;
      hints.push({ round: revealedCount, ...result });
    }
  }

  return hints;
}
