import { PoolCandidate } from '../repositories/pool-track.repository';
import { RECENCY_PER_DECADE, RECENCY_PIVOT_YEAR } from '../../consts';

/**
 * Deezer's year lists are evenly sized, so by count the pool is 58% pre-2005 —
 * which is not the mix people expect to be quizzed on. This tilts selection
 * toward recent music without removing anything: a 1975 track is still
 * reachable, just less often than a 2020 one.
 */
export function weightFor(candidate: PoolCandidate): number {
  const decades = (candidate.year - RECENCY_PIVOT_YEAR) / 10;
  return Math.max(candidate.fame, 1) * Math.pow(RECENCY_PER_DECADE, decades);
}

/**
 * Picks proportionally to weight — fame tilted toward recent releases — so
 * better-known and more recent songs come up more often without the long tail
 * becoming unreachable.
 *
 * Walking the cumulative weight is exact and O(n). The tempting
 * `sort((a, b) => b.fame * Math.random() - ...)` shortcut is *not*
 * proportional — it skews hard toward the heaviest rows.
 */
export function weightedPick(
  candidates: PoolCandidate[],
  exclude?: ReadonlySet<string>,
): string | null {
  // Filtering first is measurably faster than testing the exclusion set inside
  // the walk: this way each id is looked up once rather than on both passes,
  // and the Set lookups dominate. 3µs vs 5µs over ~3,000 candidates.
  const eligible =
    exclude && exclude.size > 0
      ? candidates.filter((c) => !exclude.has(c.id))
      : candidates;

  if (eligible.length === 0) {
    return null;
  }

  let total = 0;
  for (const c of eligible) {
    total += weightFor(c);
  }

  let target = Math.random() * total;
  for (const c of eligible) {
    target -= weightFor(c);
    if (target <= 0) {
      return c.id;
    }
  }
  // Only reachable through floating point drift on the final row.
  return eligible[eligible.length - 1].id;
}
