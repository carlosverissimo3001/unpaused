import { TrackEntity } from '../../track/entities/track.entity';
import { HintType } from '../types';
import { buildHintsForRound } from './hint-builder';

const track = (overrides?: Partial<TrackEntity>): TrackEntity =>
  ({
    id: 'track-1',
    name: 'Where Have You Been',
    artistName: 'Rihanna',
    allArtists: ['Rihanna'],
    releaseYear: 2011,
    metadata: {},
    lastScrapedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as TrackEntity;

const albumValue = (entity: TrackEntity) =>
  buildHintsForRound(entity, 5).find((h) => h.type === HintType.ALBUM)?.value;

describe('buildHintsForRound', () => {
  it('reveals nothing before the first guess', () => {
    expect(buildHintsForRound(track(), 0)).toEqual([]);
  });

  it('reveals one more hint per round', () => {
    const entity = track({ albumName: 'Talk That Talk' });

    expect(buildHintsForRound(entity, 1)).toHaveLength(1);
    expect(buildHintsForRound(entity, 2)).toHaveLength(2);
  });

  it('offers the album when it gives nothing away', () => {
    expect(albumValue(track({ albumName: 'Talk That Talk' }))).toBe(
      'Talk That Talk',
    );
  });

  describe('the album hint never contains the answer', () => {
    it('withholds an album named after the song', () => {
      expect(
        albumValue(track({ albumName: 'Where Have You Been' })),
      ).toBeUndefined();
    });

    it('withholds one that only differs by a version tag', () => {
      // The case that shipped: comparing raw strings let this through.
      expect(
        albumValue(track({ albumName: 'Where Have You Been (Remixes)' })),
      ).toBeUndefined();
    });

    it('withholds a single or EP of the same name', () => {
      expect(
        albumValue(track({ albumName: 'Where Have You Been - EP' })),
      ).toBeUndefined();
    });

    it('withholds a compilation built around the song', () => {
      expect(
        albumValue(track({ albumName: 'The Best of Where Have You Been' })),
      ).toBeUndefined();
    });

    it('ignores case and punctuation when deciding', () => {
      expect(
        albumValue(track({ albumName: 'WHERE HAVE YOU BEEN!' })),
      ).toBeUndefined();
    });
  });

  it('skips the album entirely when the track has none', () => {
    expect(albumValue(track({ albumName: undefined }))).toBeUndefined();
  });

  it('drops genre tags that just name the artist', () => {
    const entity = track({
      albumName: 'Talk That Talk',
      metadata: { lastfm: { tags: ['Rihanna'] } },
    } as Partial<TrackEntity>);

    const genre = buildHintsForRound(entity, 5).find(
      (h) => h.type === HintType.GENRE,
    );
    expect(genre?.value).toBe('');
  });
});
