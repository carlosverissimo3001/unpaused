/**
 * Rebuilds every stats row from the games that were actually played.
 *
 * Local:  pnpm --filter backend stats:recompute
 * Prod:   railway run --service Postgres -- pnpm --filter backend stats:recompute
 *
 * Until CAR-202 every finished round of every mode was counted into the ALL
 * row, so dailies were counted twice and the ALL streak mixed the two. The
 * rows cannot be corrected in place; they have to be derived again from
 * game_sessions, which holds mode, status, current_round and completed_at for
 * every round ever finished.
 *
 * Pass --dry to print what would change without writing.
 *
 * Safe to re-run: the tally is a pure function of history, so a second run
 * writes the same numbers as the first. The counting itself lives in
 * src/game/utils/stats-recompute.ts, under test.
 */
// Standalone script: no Nest ConfigModule to read .env for us.
import 'dotenv/config';
import { Pool } from 'pg';
import {
  distributionIndex,
  tallyDaily,
  tallyFreePlay,
  type FinishedGame,
  type Freeze,
  type Tally,
} from '../src/game/utils/stats-recompute';

interface SessionRow {
  mode: 'ALL' | 'DAILY';
  status: string;
  current_round: number;
  completed_at: Date;
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const { rows: users } = await pool.query<{ id: string; timezone: string }>(
      `SELECT u.id, COALESCE(p.timezone, 'UTC') AS timezone
         FROM users u
         LEFT JOIN user_preferences p ON p.user_id = u.id`,
    );

    let rewritten = 0;

    for (const user of users) {
      const { rows: sessions } = await pool.query<SessionRow>(
        `SELECT mode, status, current_round, completed_at
           FROM game_sessions
          WHERE user_id = $1
            AND status IN ('WON', 'LOST')
            AND completed_at IS NOT NULL
            AND mode IN ('ALL', 'DAILY')
          ORDER BY completed_at ASC`,
        [user.id],
      );

      if (sessions.length === 0) continue;

      const games = sessions.map((row) => {
        const won = row.status === 'WON';
        return {
          mode: row.mode,
          won,
          lastGameRound: distributionIndex(won, row.current_round),
          completedAt: row.completed_at,
        };
      });

      const { rows: freezeRows } = await pool.query<{
        covered_from: Date;
        covered_to: Date;
      }>(
        `SELECT covered_from, covered_to FROM streak_freeze_usages WHERE user_id = $1`,
        [user.id],
      );
      const freezes: Freeze[] = freezeRows.map((row) => ({
        coveredFrom: row.covered_from,
        coveredTo: row.covered_to,
      }));

      const inMode = (mode: 'ALL' | 'DAILY'): FinishedGame[] =>
        games.filter((game) => game.mode === mode);

      const byMode: Record<string, Tally> = {
        ALL: tallyFreePlay(inMode('ALL')),
        DAILY: tallyDaily(inMode('DAILY'), freezes, user.timezone),
      };

      for (const [mode, tally] of Object.entries(byMode)) {
        if (tally.totalGames === 0) continue;
        rewritten += 1;

        console.log(
          `${user.id} ${mode}: ${tally.totalGames} games, ${tally.totalWins} wins, ` +
            `current ${tally.current}, best ${tally.best}`,
        );

        if (dryRun) continue;

        await pool.query(
          `INSERT INTO stats (user_id, mode, current_streak, best_streak,
                              total_games, total_wins, score_distribution,
                              last_win_date, created_at, updated_at)
           VALUES ($1, $2::"GameMode", $3, $4, $5, $6, $7, $8, NOW(), NOW())
           ON CONFLICT (user_id, mode) DO UPDATE SET
             current_streak = EXCLUDED.current_streak,
             best_streak = EXCLUDED.best_streak,
             total_games = EXCLUDED.total_games,
             total_wins = EXCLUDED.total_wins,
             score_distribution = EXCLUDED.score_distribution,
             last_win_date = EXCLUDED.last_win_date,
             updated_at = NOW()`,
          [
            user.id,
            mode,
            tally.current,
            tally.best,
            tally.totalGames,
            tally.totalWins,
            tally.roundDistribution,
            tally.lastWinDate,
          ],
        );
      }
    }

    console.log(
      dryRun
        ? `Dry run: ${rewritten} rows would be rewritten across ${users.length} users.`
        : `Rewrote ${rewritten} rows across ${users.length} users.`,
    );
  } finally {
    await pool.end();
  }
}

void main();
