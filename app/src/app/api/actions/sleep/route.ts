import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { startTimedAction, ActionError } from "@/lib/actions";
import { DEFAULT_SHELTER_POSITION, shelterSleepDurationMs } from "@/lib/game";

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ errorCode: "NOT_LOGGED_IN" }, { status: 401 });
  }

  try {
    await startTimedAction({
      userId,
      type: "sleep",
      // Jeder Spieler hat ab der Registrierung eine Huette - Schlafen ist
      // immer an deren Standort gebunden, kein "wilder" Schlaf mehr.
      requireNear: (player) => ({
        x: player.shelterX ?? DEFAULT_SHELTER_POSITION.x,
        y: player.shelterY ?? DEFAULT_SHELTER_POSITION.y,
      }),
      nearStationKey: "sleep",
      durationMs: (player) => shelterSleepDurationMs(player.shelterLevel),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ActionError) {
      return NextResponse.json({ errorCode: err.code, ...err.meta }, { status: err.status });
    }
    throw err;
  }
}
