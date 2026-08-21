import { isSameTrack, matches, normalizeForMatch } from './preview-match';

describe('normalizeForMatch', () => {
  it('drops trailing qualifiers but keeps a leading parenthetical', () => {
    expect(normalizeForMatch('(What A) Wonderful World - Mono')).toBe(
      'whatawonderfulworld',
    );
  });

  it('strips accents so local catalogues still match', () => {
    expect(normalizeForMatch('Tití Me Preguntó')).toBe('titimepregunto');
  });

  it('removes edition parentheticals', () => {
    expect(normalizeForMatch('Nevermind (Remastered)')).toBe('nevermind');
  });
});

describe('matches', () => {
  it.each([
    ['Bohemian Rhapsody', 'Bohemian Rhapsody - Remastered 2011'],
    ['HUMBLE.', 'humble'],
    ['Guns N Roses', "Guns N' Roses"],
  ])('treats %s and %s as the same', (a, b) => {
    expect(matches(a, b)).toBe(true);
  });

  it('does not match different songs', () => {
    expect(matches('Otherside', 'Scar Tissue')).toBe(false);
  });

  it('never matches on an empty side', () => {
    expect(matches('', 'Umbrella')).toBe(false);
  });
});

describe('isSameTrack', () => {
  it('needs both title and artist to agree', () => {
    const expected = { title: 'Umbrella', artist: 'Rihanna' };
    expect(
      isSameTrack({ title: 'Umbrella', artist: 'Rihanna, JAY-Z' }, expected),
    ).toBe(true);
    expect(
      isSameTrack({ title: 'Umbrella', artist: 'The Baseballs' }, expected),
    ).toBe(false);
  });
});
