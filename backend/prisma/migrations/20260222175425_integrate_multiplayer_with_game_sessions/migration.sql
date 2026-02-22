/*
  Warnings:

  - You are about to drop the column `rounds` on the `room_players` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "GameMode" ADD VALUE 'MULTIPLAYER';

-- AlterTable
ALTER TABLE "game_sessions" ADD COLUMN     "multiplayer_room_id" TEXT;

-- AlterTable
ALTER TABLE "room_players" DROP COLUMN "rounds";

-- CreateIndex
CREATE INDEX "game_sessions_multiplayer_room_id_idx" ON "game_sessions"("multiplayer_room_id");

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_multiplayer_room_id_fkey" FOREIGN KEY ("multiplayer_room_id") REFERENCES "multiplayer_rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
