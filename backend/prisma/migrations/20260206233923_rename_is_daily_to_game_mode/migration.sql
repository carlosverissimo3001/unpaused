/*
  Warnings:

  - You are about to drop the column `is_daily` on the `game_sessions` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "game_sessions_user_id_is_daily_idx";

-- AlterTable
ALTER TABLE "game_sessions" DROP COLUMN "is_daily",
ADD COLUMN     "mode" "GameMode" NOT NULL DEFAULT 'ALL';

-- CreateIndex
CREATE INDEX "game_sessions_user_id_mode_idx" ON "game_sessions"("user_id", "mode");
