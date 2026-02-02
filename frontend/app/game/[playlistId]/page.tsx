"use client";

import { useParams } from "next/navigation";
import { GamePage } from "@/components/game/GamePage";

export default function PlaylistGamePage() {
  const params = useParams();
  const playlistId = params.playlistId as string;

  return <GamePage mode="playlist" playlistId={playlistId} />;
}
