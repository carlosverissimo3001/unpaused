-- Everyone who already played earned a named place on the leaderboard, so the
-- new default applies to rows created from here on, not retroactively to them.
UPDATE "user_preferences" SET "show_stats_to_others" = true;
