/**
 * Loads src/pool/guest-pool.json into the database.
 *
 * Local:  pnpm --filter backend pool:seed
 * Prod:   railway run --service Postgres -- pnpm --filter backend pool:seed
 *
 * Writes two tables. `tracks` gets the track data, so a pool track is an
 * ordinary Track row whose id happens to start with `dz:` and every existing
 * game path works on it unchanged. `pool_tracks` records only that it may be
 * picked, and how well known it is.
 *
 * Safe to re-run: both writes are upserts.
 */
// Standalone script: no Nest ConfigModule to read .env for us.
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';

interface PoolTrack {
  id: string;
  isrc: string;
  name: string;
  artist: string;
  albumName: string;
  albumUrl: string;
  albumImageUrl?: string;
  year: number;
  fame: number;
}

const POOL_FILE = path.join(__dirname, '..', 'src', 'pool', 'guest-pool.json');
const BATCH = 250;

async function main() {
  if (!fs.existsSync(POOL_FILE)) {
    throw new Error(`No pool file at ${POOL_FILE}. Run "pnpm pool" first.`);
  }
  const { generatedAt, tracks } = JSON.parse(
    fs.readFileSync(POOL_FILE, 'utf8'),
  ) as { generatedAt: string; tracks: PoolTrack[] };

  // Defensive: a song can reach the file twice if two uploads of it resolved to
  // the same recording. Years are ascending, so the first seen is the earliest.
  const seen = new Set<string>();
  const unique = tracks.filter((t) => {
    const key = t.isrc || t.id;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  console.log(
    `${unique.length} tracks, generated ${generatedAt}` +
      (unique.length === tracks.length
        ? ''
        : ` (${tracks.length - unique.length} duplicates dropped)`),
  );

  // DATABASE_PUBLIC_URL is what Railway injects for the Postgres service; the
  // internal host it puts in DATABASE_URL only resolves inside their network.
  const connectionString =
    process.env.DATABASE_PUBLIC_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('No DATABASE_PUBLIC_URL or DATABASE_URL set');
  }
  const remote = !connectionString.includes('localhost');
  const pool = new Pool({
    connectionString,
    ssl: remote ? { rejectUnauthorized: false } : undefined,
  });
  console.log(remote ? 'target: remote' : 'target: local');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < unique.length; i += BATCH) {
      const slice = unique.slice(i, i + BATCH);

      await client.query(
        `INSERT INTO tracks (id, name, artist_name, album_name, album_url,
                             album_image_url, release_year, isrc, all_artists,
                             last_scraped_at, created_at, updated_at)
         SELECT * FROM unnest(
           $1::text[], $2::text[], $3::text[], $4::text[], $5::text[],
           $6::text[], $7::int[], $8::text[]
         ) AS t(id, name, artist_name, album_name, album_url,
                album_image_url, release_year, isrc),
         LATERAL (SELECT ARRAY[t.artist_name]) AS a(all_artists),
         LATERAL (SELECT now(), now(), now()) AS ts(a, b, c)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           artist_name = EXCLUDED.artist_name,
           album_name = EXCLUDED.album_name,
           album_url = EXCLUDED.album_url,
           album_image_url = EXCLUDED.album_image_url,
           release_year = EXCLUDED.release_year,
           isrc = EXCLUDED.isrc,
           updated_at = now()`,
        [
          slice.map((t) => t.id),
          slice.map((t) => t.name),
          slice.map((t) => t.artist),
          slice.map((t) => t.albumName),
          slice.map((t) => t.albumUrl),
          slice.map((t) => t.albumImageUrl ?? null),
          slice.map((t) => t.year),
          slice.map((t) => t.isrc),
        ],
      );

      // Earliest year wins, decided in SQL rather than by insert order so that
      // re-running a single year cannot reassign a song to a later one.
      await client.query(
        `INSERT INTO pool_tracks (id, isrc, year, fame, refreshed_at, created_at)
         SELECT id, isrc, year, fame, now(), now() FROM unnest(
           $1::text[], $2::text[], $3::int[], $4::int[]
         ) AS t(id, isrc, year, fame)
         ON CONFLICT (isrc) DO UPDATE SET
           id = EXCLUDED.id,
           year = EXCLUDED.year,
           fame = EXCLUDED.fame,
           refreshed_at = now()
         WHERE EXCLUDED.year < pool_tracks.year`,
        [
          slice.map((t) => t.id),
          slice.map((t) => t.isrc),
          slice.map((t) => t.year),
          slice.map((t) => t.fame),
        ],
      );

      process.stdout.write(
        `  ${Math.min(i + BATCH, tracks.length)}/${tracks.length}\r`,
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  const { rows } = await pool.query(
    `SELECT (SELECT count(*) FROM pool_tracks) AS pool,
            (SELECT count(*) FROM tracks WHERE id LIKE 'dz:%') AS pool_tracks_in_tracks,
            (SELECT count(*) FROM tracks) AS tracks,
            (SELECT min(year) FROM pool_tracks) AS first_year,
            (SELECT max(year) FROM pool_tracks) AS last_year`,
  );
  console.log('\n', rows[0]);
  await pool.end();
}

main().catch((e: unknown) => {
  console.error('FAILED:', (e as Error).message);
  process.exit(1);
});
