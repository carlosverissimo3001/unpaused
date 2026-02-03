"use client";

import { GamePage } from "@/components/game/GamePage";
import { GAME_MODE } from "../../consts/consts";

export default function DailyPage() {
  return <GamePage mode={GAME_MODE.DAILY} />;
}
