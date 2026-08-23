/**
 * Builds the guest track pool from Deezer and writes src/pool/guest-pool.json.
 *
 * Run: pnpm --filter backend pool
 *
 * Takes ~35 minutes. It is a build-time job run by hand when the pool needs
 * rebuilding, never on the request path.
 */
import * as fs from 'fs';
import * as path from 'path';

const OUT = path.join(__dirname, '..', 'src', 'pool', 'guest-pool.json');

/**
 * Deezer allows roughly 50 requests per 5 seconds. Everything here is
 * sequential at this pace rather than concurrent: the job is offline, so there
 * is nothing to gain from speed and a throttle costs a whole rebuild.
 */
const PACE_MS = 650;

/**
 * Deezer's year series starts here. It is compiled retrospectively and has
 * gaps — no 1990, and nothing for the current year until they publish it.
 * Playlists are discovered by search rather than hardcoded because the
 * publishing account is inconsistent: "Deezer Best Of" for most years, but
 * "Laeti - Deezer Pop Editor" for 2024.
 */
const FIRST_YEAR = Number(process.env.POOL_FROM ?? 1971);
/** Narrow the range to smoke-test a change without a 35 minute run. */
const LAST_YEAR = Number(process.env.POOL_TO ?? new Date().getFullYear());

interface DeezerTrack {
  id: number;
  title: string;
  isrc?: string;
  rank: number;
  preview?: string;
  artist: { name: string };
  album: { id: number; title: string; cover_big?: string; cover_xl?: string };
}

interface PoolTrack {
  id: string;
  isrc: string;
  name: string;
  artist: string;
  albumName: string;
  albumUrl: string;
  albumImageUrl?: string;
  year: number;
  /** Popularity of the song across every upload, not of the chosen recording. */
  fame: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const normIsrc = (v?: string) =>
  (v ?? '').replace(/[^a-z0-9]/gi, '').toUpperCase();

/** Collapses a title to its song identity, dropping credits and version tags. */
const soft = (v?: string) =>
  (v ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s*[([][^)\]]*[)\]]/g, '')
    .replace(/\s+-\s+.*$/, '')
    .replace(/[^a-z0-9]/g, '');

/** The title as a person would type it: no credits, no version tag. */
const bare = (v: string) =>
  v
    .replace(/\s*[([][^)\]]*[)\]]/g, '')
    .replace(/\s+-\s+.*$/, '')
    .trim();

/** Tags that make a recording a different listening experience, not a reissue. */
const VARIANT =
  /(remix|live|acoustic|instrumental|karaoke|cover|tribute|demo|edit|version|remaster|radio|extended|sped up|slowed)/i;

/**
 * Deezer answers 200 with an error body when its rate limit is hit, so a
 * missing payload is not the same as an empty result. Conflating the two
 * silently produced a 31% match rate where the real one was 97%.
 */
async function dz<T>(url: string, attempts = 6): Promise<T | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        await sleep(1000 * (i + 1));
        continue;
      }
      const body = (await response.json()) as T & {
        error?: Record<string, unknown>;
      };
      if (body?.error && Object.keys(body.error).length > 0) {
        await sleep(2000 * (i + 1));
        continue;
      }
      return body;
    } catch {
      await sleep(1000 * (i + 1));
    }
  }
  return null;
}

async function findYearPlaylists(): Promise<{ year: number; id: number }[]> {
  const found: { year: number; id: number }[] = [];

  for (let year = FIRST_YEAR; year <= LAST_YEAR; year++) {
    const body = await dz<{
      data?: { id: number; title: string; user?: { name: string } }[];
    }>(
      `https://api.deezer.com/search/playlist?limit=8&q=${encodeURIComponent(
        `Top Hits ${year}`,
      )}`,
    );
    // The title has to match exactly: searching 1990 happily returns 1991.
    const hit = (body?.data ?? []).find(
      (p) =>
        p.title.trim().toLowerCase() === `top hits ${year}` &&
        /deezer/i.test(p.user?.name ?? ''),
    );
    if (hit) {
      found.push({ year, id: hit.id });
    }
    await sleep(PACE_MS);
  }
  return found;
}

/**
 * The copy of a song sitting in a year playlist is often a remaster or a
 * regional upload rather than the one everyone streams — "Unwritten" is in the
 * 2006 list at rank 4,463 while its canonical upload sits at 879,086. Rank is
 * what will decide how recognizable a round feels, so every track is
 * re-resolved to the most popular instance of the same song. This also recovers
 * audio: the playlist copy is frequently region-locked while the canonical one
 * is not.
 */
async function canonicalize(
  track: DeezerTrack,
): Promise<{ best: DeezerTrack; fame: number }> {
  // Search on the bare title. Deezer returns *nothing at all* for a query
  // carrying a version tag — "Queen I Want To Break Free (Remastered 2011)"
  // yields zero hits — which would silently leave every remaster unimproved.
  const body = await dz<{ data?: DeezerTrack[] }>(
    `https://api.deezer.com/search?limit=15&q=${encodeURIComponent(
      `${track.artist.name} ${bare(track.title)}`,
    )}`,
  );
  const sameSong = (body?.data ?? []).filter(
    (c) =>
      c.preview &&
      soft(c.title) === soft(track.title) &&
      soft(c.artist?.name) === soft(track.artist.name),
  );

  // Prefer a clean recording in both directions. Never trade a plain title down
  // to a variant however popular it is, and do trade up when the playlist hands
  // us one: year lists are full of remaster and live uploads standing in for the
  // studio hit people actually know.
  const clean = sameSong.filter((c) => !VARIANT.test(c.title));
  const candidates = clean.length > 0 ? clean : sameSong;

  // How well known the *song* is, taken across every upload of it. Kept apart
  // from the recording we choose: Van Halen's "Jump" is rank 859,713 as the
  // 2015 remaster and 70,077 as the clean upload, so reading fame off the
  // chosen recording would rate one of the decade's biggest songs as a deep cut.
  const fame = Math.max(track.rank, ...sameSong.map((c) => c.rank));

  const best = candidates.sort((a, b) => b.rank - a.rank)[0];
  if (!best) {
    return { best: track, fame };
  }
  // A clean replacement wins on title alone; otherwise it has to be more popular.
  const tradingUp = VARIANT.test(track.title) && !VARIANT.test(best.title);
  return { best: tradingUp || best.rank > track.rank ? best : track, fame };
}

/** Written after every year so an interrupted run can pick up where it stopped. */
function save(pool: Map<string, PoolTrack>, done: Set<number>) {
  const tracks = [...pool.values()].sort(
    (a, b) => a.year - b.year || b.fame - a.fame,
  );
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        years: [...done].sort((a, b) => a - b),
        tracks,
      },
      null,
      2,
    ),
    'utf8',
  );
  return tracks;
}

async function main() {
  const years = await findYearPlaylists();
  console.log(
    `found ${years.length} year playlists (${years[0]?.year}-${years[years.length - 1]?.year})`,
  );

  // Keyed by song identity rather than track id, so a song charting either side
  // of a new year collapses into one entry.
  const pool = new Map<string, PoolTrack>();
  const done = new Set<number>();
  // A full run is ~35 minutes of network calls; resuming beats restarting when
  // the machine or the shell goes away mid-way.
  if (fs.existsSync(OUT)) {
    const prior = JSON.parse(fs.readFileSync(OUT, 'utf8')) as {
      years?: number[];
      tracks?: PoolTrack[];
    };
    for (const t of prior.tracks ?? []) {
      pool.set(t.isrc || `${soft(t.name)}|${soft(t.artist)}`, t);
    }
    for (const y of prior.years ?? []) {
      done.add(y);
    }
    if (done.size > 0) {
      console.log(
        `resuming: ${done.size} years already done, ${pool.size} tracks`,
      );
    }
  }
  let raw = 0;
  let upgraded = 0;
  let dropped = 0;

  for (const { year, id } of years) {
    if (done.has(year)) {
      continue;
    }
    const body = await dz<{ data?: DeezerTrack[] }>(
      `https://api.deezer.com/playlist/${id}/tracks?limit=100`,
    );
    const tracks = body?.data ?? [];
    raw += tracks.length;
    await sleep(PACE_MS);

    for (const track of tracks) {
      const key =
        normIsrc(track.isrc) ||
        `${soft(track.title)}|${soft(track.artist?.name)}`;
      // First year wins: a song belongs to the year it broke, not the one it lingered into.
      if (pool.has(key)) {
        continue;
      }

      const { best, fame } = await canonicalize(track);
      await sleep(PACE_MS);
      if (best.id !== track.id) {
        upgraded++;
      }

      if (!best.preview) {
        // No playable audio anywhere on Deezer. The cascade might still find it
        // on iTunes at request time, but a pool entry nobody can hear is a
        // broken round, so it stays out.
        dropped++;
        continue;
      }

      pool.set(key, {
        id: `dz:${best.id}`,
        isrc: normIsrc(best.isrc) || normIsrc(track.isrc),
        name: best.title,
        artist: best.artist.name,
        albumName: best.album?.title ?? '',
        albumUrl: `https://www.deezer.com/album/${best.album?.id}`,
        albumImageUrl: best.album?.cover_xl ?? best.album?.cover_big,
        year,
        fame,
      });
    }
    done.add(year);
    save(pool, done);
    console.log(`  ${year}: pool ${pool.size}`);
  }

  const tracks = save(pool, done);

  const byDecade: Record<number, number> = {};
  for (const t of tracks) {
    const decade = Math.floor(t.year / 10) * 10;
    byDecade[decade] = (byDecade[decade] ?? 0) + 1;
  }

  console.log(`\nraw       ${raw}`);
  console.log(`upgraded  ${upgraded}  (swapped for a more popular instance)`);
  console.log(`dropped   ${dropped}  (no preview anywhere)`);
  console.log(`pool      ${tracks.length}`);
  console.log('\nby decade:');
  for (const decade of Object.keys(byDecade).sort()) {
    console.log(`  ${decade}s: ${byDecade[Number(decade)]}`);
  }
  console.log(`\nwritten to ${OUT}`);
}

main().catch((e) => {
  console.error('FAILED:', (e as Error).message);
  process.exit(1);
});
