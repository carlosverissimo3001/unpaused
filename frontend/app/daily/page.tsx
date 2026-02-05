"use client";

import { GamePage } from "@/components/game/GamePage";
import { GameStatsDtoModeEnum as GameMode } from "../../sdk";

export default function DailyPage() {
  return <GamePage mode={GameMode.Daily} />;
}
