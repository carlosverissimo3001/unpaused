-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "daily_challenge_playlists" TEXT[] DEFAULT ARRAY[]::TEXT[];
