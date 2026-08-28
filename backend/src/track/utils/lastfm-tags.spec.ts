import { isDescriptiveTag } from './lastfm-tags';

describe('isDescriptiveTag', () => {
  it.each(['Hip-Hop', 'rnb', 'alternative rock', 'Música brasileira'])(
    'keeps %p',
    (tag) => {
      expect(isDescriptiveTag(tag)).toBe(true);
    },
  );

  it('drops an id somebody used as a tag', () => {
    // Seen in the wild on a real track.
    expect(isDescriptiveTag('-1001760493747')).toBe(false);
  });

  it('drops a year, which would give away the era hint', () => {
    expect(isDescriptiveTag('1984')).toBe(false);
  });

  it.each(['', '   ', '***', '2024'])('drops %p', (tag) => {
    expect(isDescriptiveTag(tag)).toBe(false);
  });

  it('drops something too long to be a genre', () => {
    expect(isDescriptiveTag('a'.repeat(31))).toBe(false);
  });
});
