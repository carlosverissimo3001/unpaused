import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Track ids are namespaced by catalogue — bare ones come from Spotify, `dz:`
 * ones from the guest pool — so a Spotify URL built from an id is only correct
 * by luck. It renders normally and 404s on click, which is why it has slipped
 * through review twice: once when the pool was added, and again when a branch
 * cut before the fix was merged over the top of it.
 *
 * The backend sends `trackUrl` already resolved. This fails the build if
 * anything starts guessing again.
 */
const ROOT = join(__dirname, '..');
const SKIP = new Set(['node_modules', '.next', 'sdk', 'out', '.turbo']);
const EXTENSIONS = ['.ts', '.tsx'];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    if (SKIP.has(entry)) {
      return [];
    }
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      return sourceFiles(path);
    }
    if (!EXTENSIONS.some((ext) => entry.endsWith(ext))) {
      return [];
    }
    // This file necessarily contains the pattern it forbids.
    return path === __filename ? [] : [path];
  });
}

describe('catalogue links', () => {
  it('are never built by interpolating a track id into a Spotify url', () => {
    const interpolated = /open\.spotify\.com\/(track|album)\/\$\{/;

    const offenders = sourceFiles(ROOT).filter((file) =>
      interpolated.test(readFileSync(file, 'utf8')),
    );

    expect(offenders.map((f) => f.slice(ROOT.length + 1))).toEqual([]);
  });
});
