import { generateHandle, ADJECTIVES, NOUNS } from './handle-generator';

// ── Tests ────────────────────────────────────────────────────────────

describe('generateHandle', () => {
  it('returns two words drawn from the word lists', () => {
    const [adjective, noun, ...rest] = generateHandle().split(' ');

    expect(rest).toHaveLength(0);
    expect(ADJECTIVES).toContain(adjective);
    expect(NOUNS).toContain(noun);
  });

  it('does not always return the same handle', () => {
    const handles = new Set(Array.from({ length: 50 }, () => generateHandle()));

    expect(handles.size).toBeGreaterThan(1);
  });
});
