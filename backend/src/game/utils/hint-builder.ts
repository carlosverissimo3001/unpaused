import { TrackMetadataVo } from '../../track/vo/track-metadata.vo';
import { TrackEntity } from '../../track/entities/track.entity';
import { getDecade } from 'date-fns';
import { compareText, normalizeTrackNameForMatch } from '../../utils/text';
import { HintDto } from '../dto/hint/hint.dto';
import { HintType } from '../types';

type HintProducer = (
  track: TrackEntity,
  metadata: TrackMetadataVo,
) => Omit<HintDto, 'round'> | null;

const genreHint: HintProducer = (track, metadata) => {
  const rawTags = metadata.lastfm?.tags;
  if (!rawTags?.length) {
    return null;
  }

  const tags = rawTags.filter((t) => {
    // Filter out tags that are too similar to any artist name, as they are not really hints
    return !track.allArtists.some((artist) => compareText(t, artist));
  });

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
