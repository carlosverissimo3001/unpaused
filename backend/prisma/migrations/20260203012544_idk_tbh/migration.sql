-- DropForeignKey
ALTER TABLE "game_sessions" DROP CONSTRAINT "game_sessions_user_id_fkey";

-- CreateIndex
CREATE INDEX "game_sessions_user_id_idx" ON "game_sessions"("user_id");

-- CreateIndex
CREATE INDEX "game_sessions_user_id_is_daily_idx" ON "game_sessions"("user_id", "is_daily");

-- CreateIndex
CREATE INDEX "game_sessions_user_id_created_at_idx" ON "game_sessions"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
