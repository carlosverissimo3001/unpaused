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
 * The tracks carry no Deezer id. Previews are resolved from title and artist
 * at play time by the same lookup every other round uses, so a song that
 * cannot be found is passed over rather than seeded wrong.
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
/** Only present because the column is; nothing reads it for a special group. */
const YEAR = 2026;

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

    for (const [index, track] of group.tracks.entries()) {
      // Stable and derived from position, so re-running rewrites rather than
      // duplicating.
      const id = `special:${group.slug}:${String(index + 1).padStart(3, '0')}`;

      await client.query(
        `INSERT INTO tracks (id, name, artist_name, all_artists, last_scraped_at, created_at, updated_at)
         VALUES ($1, $2, $3, ARRAY[$3], NOW(), NOW(), NOW())
         ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name,
               artist_name = EXCLUDED.artist_name,
               all_artists = EXCLUDED.all_artists`,
        [id, track.name, track.artistName],
      );

      await client.query(
        `INSERT INTO pool_tracks (id, isrc, year, fame, special)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (id) DO UPDATE SET special = true`,
        [id, id, YEAR, FAME],
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
      `Seeded ${group.tracks.length} tracks into "${group.name}" (${groupId})`,
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
