/**
 * Loads a special track group from a JSON file: the group, its tracks, and
 * which tracks are in it.
 *
 *   pnpm --filter backend special:seed -- ./path/to/group.json
 *   railway run --service Postgres -- pnpm --filter backend special:seed -- ./path/to/group.json
 *
 * The file is an argument rather than a fixture, so what a given event
 * actually contains does not have to live in the repository.
 *
 *   { "slug": "...", "name": "...", "tracks": [{ "name": "...", "artistName": "..." }] }
 *
 * Each track is looked up on Deezer once, here, for its album, cover, year and
 * ISRC. Doing it at play time instead would be a request per round for data
 * that never changes, and a round without a cover or an album hint looks like
 * nothing. A song Deezer cannot find is still seeded — the preview lookup gets
 * another go at it from title and artist when someone plays it.
 *
 * Their pool rows are marked `special`, which keeps them out of the shuffle,
 * the daily and the decades — an unexpected song arriving in a random round
 * is a bug.
 *
 * Safe to re-run: every write is an upsert or does nothing on conflict.
 */
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';

interface SpecialGroupFile {
  slug: string;
  name: string;
  tracks: { name: string; artistName: string }[];
}

/** They are all as famous as each other here, so the weighting is flat. */
const FAME = 500_000;
/** Stands in when Deezer has no date for a track. */
const UNKNOWN_YEAR = 0;

const DEEZER_SEARCH = 'https://api.deezer.com/search';
const DEEZER_TRACK = 'https://api.deezer.com/track/';
/** Deezer allows 50 requests per 5 seconds; this stays well under it. */
const PAUSE_MS = 120;

interface Details {
  albumName?: string;
  albumImageUrl?: string;
  albumUrl?: string;
  releaseYear?: number;
  isrc?: string;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Null when Deezer has nothing for it, which is not a reason to skip the song. */
async function lookup(
  name: string,
  artistName: string,
): Promise<Details | null> {
  const query = new URLSearchParams({
    q: `artist:"${artistName}" track:"${name}"`,
    limit: '1',
  });
  const hits = await getJson<{ data?: { id?: number }[] }>(
    `${DEEZER_SEARCH}?${query}`,
  );
  const id = hits?.data?.[0]?.id;
  if (!id) {
    return null;
  }

  const track = await getJson<{
    isrc?: string;
    release_date?: string;
    album?: {
      title?: string;
      cover_xl?: string;
      cover_big?: string;
      link?: string;
    };
  }>(`${DEEZER_TRACK}${id}`);
  if (!track) {
    return null;
  }

  const year = Number.parseInt(track.release_date?.slice(0, 4) ?? '', 10);

  return {
    albumName: track.album?.title,
    albumImageUrl: track.album?.cover_xl ?? track.album?.cover_big,
    albumUrl: track.album?.link,
    releaseYear: Number.isFinite(year) ? year : undefined,
    isrc: track.isrc,
  };
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    throw new Error('Pass the path to the group JSON as the first argument');
  }

  const group = JSON.parse(
    fs.readFileSync(path.resolve(file), 'utf8'),
  ) as SpecialGroupFile;

  if (!group.slug || !group.name || !group.tracks?.length) {
    throw new Error('The file needs a slug, a name and at least one track');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO track_groups (id, type, name, slug)
       VALUES (gen_random_uuid(), 'SPECIAL', $1, $2)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [group.name, group.slug],
    );
    const groupId = rows[0].id;

    let found = 0;

    for (const [index, track] of group.tracks.entries()) {
      // Stable and derived from position, so re-running rewrites rather than
      // duplicating.
      const id = `special:${group.slug}:${String(index + 1).padStart(3, '0')}`;

      const details = await lookup(track.name, track.artistName);
      if (details) {
        found += 1;
      }
      await wait(PAUSE_MS);

      await client.query(
        `INSERT INTO tracks (id, name, artist_name, all_artists, album_name,
                             album_image_url, album_url, release_year, isrc,
                             last_scraped_at, created_at, updated_at)
         VALUES ($1, $2, $3, ARRAY[$3], $4, $5, $6, $7, $8, NOW(), NOW(), NOW())
         ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name,
               artist_name = EXCLUDED.artist_name,
               all_artists = EXCLUDED.all_artists,
               -- Kept if it is already there: a later run must not undo a
               -- correction made by hand.
               album_name = COALESCE(tracks.album_name, EXCLUDED.album_name),
               album_image_url = COALESCE(tracks.album_image_url, EXCLUDED.album_image_url),
               album_url = COALESCE(tracks.album_url, EXCLUDED.album_url),
               release_year = COALESCE(tracks.release_year, EXCLUDED.release_year),
               isrc = COALESCE(tracks.isrc, EXCLUDED.isrc)`,
        [
          id,
          track.name,
          track.artistName,
          details?.albumName ?? null,
          details?.albumImageUrl ?? null,
          details?.albumUrl ?? null,
          details?.releaseYear ?? null,
          details?.isrc ?? null,
        ],
      );

      // The pool's isrc is unique and only used to keep one song out of the
      // pool twice, so the id stands in for it: a real one could belong to a
      // track already in the curated pool and take the whole seed down with
      // it. The real one is on the track, where it is what a guess matches on.
      await client.query(
        `INSERT INTO pool_tracks (id, isrc, year, fame, special)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (id) DO UPDATE SET special = true, year = EXCLUDED.year`,
        [id, id, details?.releaseYear ?? UNKNOWN_YEAR, FAME],
      );

      await client.query(
        `INSERT INTO track_group_tracks (track_id, track_group_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [id, groupId],
      );
    }

    await client.query('COMMIT');
    console.log(
      `Seeded ${group.tracks.length} tracks into "${group.name}" (${groupId}); ` +
        `${found} found on Deezer, ${group.tracks.length - found} without details`,
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

void main();
