"use client";

import { useParams } from "next/navigation";
import { GamePage } from "@/components/game/GamePage";
import { GAME_MODE } from "../../../consts/consts";

export default function PlaylistGamePage() {
  const params = useParams();
  const playlistId = params.playlistId as string;

  return <GamePage mode={GAME_MODE.PLAYLIST} playlistId={playlistId} />;
}
