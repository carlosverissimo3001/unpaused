-- CreateIndex
CREATE INDEX "multiplayer_rooms_host_id_idx" ON "multiplayer_rooms"("host_id");

-- CreateIndex
CREATE INDEX "room_players_user_id_idx" ON "room_players"("user_id");
