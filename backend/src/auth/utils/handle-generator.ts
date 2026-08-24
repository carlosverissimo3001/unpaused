export const ADJECTIVES = [
  'Acoustic', 'Analog', 'Brass', 'Distant', 'Electric', 'Golden',
  'Hazy', 'Loud', 'Midnight', 'Neon', 'Quiet', 'Reverb',
  'Slow', 'Static', 'Sunlit', 'Velvet', 'Vinyl', 'Warm',
] as const;

export const NOUNS = [
  'Bassline', 'Bridge', 'Chorus', 'Crescendo', 'Demo', 'Encore',
  'Fader', 'Hook', 'Intro', 'Needle', 'Outro', 'Refrain',
  'Riff', 'Sample', 'Sleeve', 'Tempo', 'Verse', 'Vocal',
] as const;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function generateHandle(): string {
  return `${pick(ADJECTIVES)} ${pick(NOUNS)}`;
}
