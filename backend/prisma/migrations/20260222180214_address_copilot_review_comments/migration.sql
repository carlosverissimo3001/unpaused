-- DropForeignKey
ALTER TABLE "multiplayer_rooms" DROP CONSTRAINT "multiplayer_rooms_host_id_fkey";

-- DropForeignKey
ALTER TABLE "room_players" DROP CONSTRAINT "room_players_user_id_fkey";

-- CreateIndex
CREATE INDEX "room_players_room_id_idx" ON "room_players"("room_id");

-- AddForeignKey
ALTER TABLE "multiplayer_rooms" ADD CONSTRAINT "multiplayer_rooms_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_players" ADD CONSTRAINT "room_players_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
