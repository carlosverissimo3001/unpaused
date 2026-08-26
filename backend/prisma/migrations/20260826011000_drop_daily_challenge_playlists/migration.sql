-- The daily now draws one shared track from the curated pool, so which of a
-- player's own playlists it came from is no longer a question.
ALTER TABLE "user_preferences" DROP COLUMN "daily_challenge_playlists";
